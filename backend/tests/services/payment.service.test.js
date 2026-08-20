const paymentService = require("../../src/services/payment.service");
const {
  createOrder,
  createProduct,
  createTestUser,
  disconnectTestDatabase,
  prisma,
  resetTestDatabase,
} = require("../helpers/test-db");
const {
  mockStripe,
} = require("../helpers/stripe-mock");

describe("payment service Stripe logic", () => {
  let stripe;

  beforeEach(async () => {
    await resetTestDatabase();
    stripe = mockStripe();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  const createPayableOrder = async ({ userId, status = "PENDING", orderOverrides = {} } = {}) => {
    const user = userId ? null : await createTestUser();
    const product = await createProduct({
      name: "Camara",
      price: "30.00",
      stock: 5,
    });
    const order = await createOrder({
      userId: userId || user.id,
      status,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 2,
          price: "30.00",
        },
      ],
      ...orderOverrides,
    });

    return {
      user,
      product,
      order,
    };
  };

  it("crea Checkout Session con metadata/orderId e idempotency key", async () => {
    const { user, order } = await createPayableOrder();
    const expiresAt = Math.floor(Date.now() / 1000) + 1800;

    stripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_new",
      url: "https://checkout.stripe.test/new",
      status: "open",
      expires_at: expiresAt,
      payment_intent: "pi_test_new",
    });

    const session = await paymentService.createCheckoutSession(order.id, user.id);

    expect(session.url).toBe("https://checkout.stripe.test/new");
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: String(order.id),
        metadata: expect.objectContaining({
          orderId: String(order.id),
          userId: String(user.id),
        }),
        payment_intent_data: expect.objectContaining({
          metadata: expect.objectContaining({
            orderId: String(order.id),
            userId: String(user.id),
          }),
        }),
      }),
      {
        idempotencyKey: `checkout_session_order_${order.id}_attempt_0`,
      }
    );

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedOrder.stripeCheckoutSessionId).toBe("cs_test_new");
    expect(updatedOrder.stripePaymentIntentId).toBe("pi_test_new");
  });

  it("rechaza Order no PENDING", async () => {
    const { user, order } = await createPayableOrder({ status: "PAID" });

    await expect(
      paymentService.createCheckoutSession(order.id, user.id)
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "ORDER_NOT_PAYABLE",
    });
  });

  it("reutiliza Checkout Session abierta y vigente", async () => {
    const { user, order } = await createPayableOrder({
      orderOverrides: {
        stripeCheckoutSessionId: "cs_test_open",
        stripeCheckoutSessionAttempt: 2,
      },
    });

    stripe.checkout.sessions.retrieve.mockResolvedValue({
      id: "cs_test_open",
      url: "https://checkout.stripe.test/open",
      status: "open",
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      payment_intent: "pi_test_open",
    });

    const session = await paymentService.createCheckoutSession(order.id, user.id);

    expect(session.id).toBe("cs_test_open");
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedOrder.stripePaymentIntentId).toBe("pi_test_open");
  });

  it("crea nueva sesion si la anterior expiro", async () => {
    const { user, order } = await createPayableOrder({
      orderOverrides: {
        stripeCheckoutSessionId: "cs_test_expired",
        stripeCheckoutSessionAttempt: 2,
      },
    });

    stripe.checkout.sessions.retrieve.mockResolvedValue({
      id: "cs_test_expired",
      status: "expired",
      url: null,
      expires_at: Math.floor(Date.now() / 1000) - 60,
    });
    stripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_retry",
      url: "https://checkout.stripe.test/retry",
      status: "open",
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      payment_intent: null,
    });

    const session = await paymentService.createCheckoutSession(order.id, user.id);

    expect(session.id).toBe("cs_test_retry");
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.any(Object),
      {
        idempotencyKey: `checkout_session_order_${order.id}_attempt_3`,
      }
    );

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedOrder.stripeCheckoutSessionId).toBe("cs_test_retry");
    expect(updatedOrder.stripeCheckoutSessionAttempt).toBe(3);
  });

  it("mantiene ownership por userId", async () => {
    const { order } = await createPayableOrder();
    const attacker = await createTestUser();

    await expect(
      paymentService.createCheckoutSession(order.id, attacker.id)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "ORDER_NOT_FOUND",
    });
  });

  it("crea PaymentIntent y persiste stripePaymentIntentId", async () => {
    const { user, order } = await createPayableOrder();

    stripe.paymentIntents.create.mockResolvedValue({
      id: "pi_test_created",
      client_secret: "secret",
    });

    const paymentIntent = await paymentService.createPaymentIntent(order.id, user.id);

    expect(paymentIntent.id).toBe("pi_test_created");
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 6000,
        metadata: {
          orderId: String(order.id),
          userId: String(user.id),
        },
      }),
      {
        idempotencyKey: `payment_intent_order_${order.id}`,
      }
    );

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedOrder.stripePaymentIntentId).toBe("pi_test_created");
  });
});
