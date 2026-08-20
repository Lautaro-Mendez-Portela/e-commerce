const {
  authHeader,
  createCartItem,
  createOrder,
  createProduct,
  createTestUser,
  disconnectTestDatabase,
  prisma,
  resetTestDatabase,
} = require("../helpers/test-db");
const request = require("../helpers/http");
const {
  mockStripe,
  stripe,
} = require("../helpers/stripe-mock");

const signPayload = (event) => {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });

  return {
    payload,
    signature,
  };
};

const sendSignedEvent = (event) => {
  const { payload, signature } = signPayload(event);

  return request
    .post("/payments/webhook")
    .set("Stripe-Signature", signature)
    .set("Content-Type", "application/json")
    .send(payload);
};

const checkoutCompletedEvent = ({
  id = "evt_checkout_completed",
  orderId,
  userId,
  sessionId = "cs_test_completed",
  paymentIntentId = "pi_test_completed",
  paymentStatus = "paid",
} = {}) => ({
  id,
  type: "checkout.session.completed",
  data: {
    object: {
      id: sessionId,
      client_reference_id: String(orderId),
      payment_intent: paymentIntentId,
      payment_status: paymentStatus,
      metadata: {
        orderId: String(orderId),
        userId: String(userId),
      },
    },
  },
});

const paymentIntentSucceededEvent = ({
  id = "evt_pi_succeeded",
  orderId,
  paymentIntentId = "pi_test_completed",
  status = "succeeded",
} = {}) => ({
  id,
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: paymentIntentId,
      status,
      metadata: {
        orderId: String(orderId),
      },
    },
  },
});

describe("Stripe webhook integration", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    mockStripe();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("rechaza firma invalida", async () => {
    const response = await request
      .post("/payments/webhook")
      .set("Stripe-Signature", "firma-invalida")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ id: "evt_bad", type: "ping", data: { object: {} } }))
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_WEBHOOK_SIGNATURE");
  });

  it("checkout exitoso marca PAID, decrementa stock y limpia solo items comprados", async () => {
    const user = await createTestUser();
    const productA = await createProduct({ name: "Producto A", stock: 5, price: "10.00" });
    const productB = await createProduct({ name: "Producto B", stock: 5, price: "20.00" });

    const originalCartItem = await createCartItem({
      userId: user.id,
      productId: productA.id,
      quantity: 2,
    });

    const createdOrder = await request
      .post("/orders")
      .set("Authorization", authHeader(user))
      .expect(201);

    await request
      .post("/cart")
      .set("Authorization", authHeader(user))
      .send({ productId: productA.id, quantity: 1 })
      .expect(200);

    await request
      .post("/cart")
      .set("Authorization", authHeader(user))
      .send({ productId: productB.id, quantity: 1 })
      .expect(200);

    await sendSignedEvent(checkoutCompletedEvent({
      orderId: createdOrder.body.id,
      userId: user.id,
      paymentIntentId: "pi_cleanup",
    })).expect(200);

    const order = await prisma.order.findUnique({
      where: { id: createdOrder.body.id },
      include: { items: true },
    });
    const productAAfter = await prisma.product.findUnique({ where: { id: productA.id } });
    const productBAfter = await prisma.product.findUnique({ where: { id: productB.id } });
    const cart = await prisma.cartItem.findMany({
      where: { userId: user.id },
      orderBy: { productId: "asc" },
    });

    expect(order.status).toBe("PAID");
    expect(order.items[0].cartItemId).toBe(originalCartItem.id);
    expect(productAAfter.stock).toBe(3);
    expect(productBAfter.stock).toBe(5);
    expect(cart).toEqual([
      expect.objectContaining({ productId: productA.id, quantity: 1 }),
      expect.objectContaining({ productId: productB.id, quantity: 1 }),
    ]);
  });

  it("mismo StripeEvent dos veces no decrementa stock dos veces", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 2, price: "10.00" });
    const order = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 2,
          price: "10.00",
        },
      ],
    });
    const event = checkoutCompletedEvent({
      id: "evt_same_event",
      orderId: order.id,
      userId: user.id,
      paymentIntentId: "pi_same_event",
    });

    await sendSignedEvent(event).expect(200);
    await sendSignedEvent(event).expect(200);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    const events = await prisma.stripeEvent.findMany();

    expect(productAfter.stock).toBe(0);
    expect(events).toHaveLength(1);
  });

  it("event IDs distintos del mismo pago no duplican procesamiento", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 2, price: "10.00" });
    const order = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 2,
          price: "10.00",
        },
      ],
    });

    await sendSignedEvent(checkoutCompletedEvent({
      id: "evt_checkout_once",
      orderId: order.id,
      userId: user.id,
      paymentIntentId: "pi_same_payment",
    })).expect(200);

    await sendSignedEvent(paymentIntentSucceededEvent({
      id: "evt_pi_same_payment",
      orderId: order.id,
      paymentIntentId: "pi_same_payment",
    })).expect(200);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });

    expect(productAfter.stock).toBe(0);
    expect(orderAfter.status).toBe("PAID");
  });

  it("stock insuficiente despues de pago solicita refund y termina REFUNDED", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 1, price: "10.00" });
    const order = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 2,
          price: "10.00",
        },
      ],
    });

    stripe.refunds.create.mockResolvedValue({
      id: "re_test_stock",
      status: "succeeded",
    });

    await sendSignedEvent(checkoutCompletedEvent({
      id: "evt_refund_stock",
      orderId: order.id,
      userId: user.id,
      paymentIntentId: "pi_refund_stock",
    })).expect(200);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });

    expect(productAfter.stock).toBe(1);
    expect(orderAfter.status).toBe("REFUNDED");
    expect(orderAfter.stripePaymentIntentId).toBe("pi_refund_stock");
    expect(orderAfter.stripeRefundId).toBe("re_test_stock");
    expect(stripe.refunds.create).toHaveBeenCalledTimes(1);
  });

  it("webhook duplicado despues del refund no genera segundo refund", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 0, price: "10.00" });
    const order = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "10.00",
        },
      ],
    });

    stripe.refunds.create.mockResolvedValue({
      id: "re_test_once",
      status: "succeeded",
    });

    await sendSignedEvent(checkoutCompletedEvent({
      id: "evt_refund_once",
      orderId: order.id,
      userId: user.id,
      paymentIntentId: "pi_refund_once",
    })).expect(200);

    await sendSignedEvent(paymentIntentSucceededEvent({
      id: "evt_after_refund",
      orderId: order.id,
      paymentIntentId: "pi_refund_once",
    })).expect(200);

    expect(stripe.refunds.create).toHaveBeenCalledTimes(1);
  });

  it("checkout expirado cancela orden y deja stock intacto", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 2, price: "10.00" });
    const order = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "10.00",
        },
      ],
    });
    const event = {
      id: "evt_checkout_expired",
      type: "checkout.session.expired",
      data: {
        object: {
          id: "cs_expired",
          client_reference_id: String(order.id),
          payment_status: "expired",
          metadata: {
            orderId: String(order.id),
            userId: String(user.id),
          },
        },
      },
    };

    await sendSignedEvent(event).expect(200);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });

    expect(productAfter.stock).toBe(2);
    expect(orderAfter.status).toBe("CANCELLED");
  });

  it("payment failed marca FAILED y deja stock intacto", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 2, price: "10.00" });
    const order = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "10.00",
        },
      ],
    });
    const event = {
      id: "evt_payment_failed",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_failed",
          status: "requires_payment_method",
          metadata: {
            orderId: String(order.id),
          },
        },
      },
    };

    await sendSignedEvent(event).expect(200);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });

    expect(productAfter.stock).toBe(2);
    expect(orderAfter.status).toBe("FAILED");
    expect(orderAfter.stripePaymentIntentId).toBe("pi_failed");
  });

  it("si falla refund, deja Order FAILED y permite retry posterior sin duplicar", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 0, price: "10.00" });
    const order = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "10.00",
        },
      ],
    });
    const event = checkoutCompletedEvent({
      id: "evt_refund_retry",
      orderId: order.id,
      userId: user.id,
      paymentIntentId: "pi_refund_retry",
    });

    stripe.refunds.create.mockRejectedValueOnce(new Error("stripe down"));

    await sendSignedEvent(event).expect(500);

    const failedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const eventsAfterFailure = await prisma.stripeEvent.findMany();

    expect(failedOrder.status).toBe("FAILED");
    expect(failedOrder.stripePaymentIntentId).toBe("pi_refund_retry");
    expect(failedOrder.stripeRefundId).toBeNull();
    expect(eventsAfterFailure).toHaveLength(0);

    stripe.refunds.create.mockResolvedValueOnce({
      id: "re_retry_success",
      status: "succeeded",
    });

    await sendSignedEvent(event).expect(200);

    const refundedOrder = await prisma.order.findUnique({ where: { id: order.id } });

    expect(refundedOrder.status).toBe("REFUNDED");
    expect(refundedOrder.stripeRefundId).toBe("re_retry_success");
    expect(stripe.refunds.create).toHaveBeenCalledTimes(2);
  });

  it("dos ordenes compitiendo por stock no producen stock negativo", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 1, price: "10.00" });
    const firstOrder = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "10.00",
        },
      ],
    });
    const secondOrder = await createOrder({
      userId: user.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "10.00",
        },
      ],
    });

    stripe.refunds.create.mockResolvedValue({
      id: "re_competing_stock",
      status: "succeeded",
    });

    await sendSignedEvent(checkoutCompletedEvent({
      id: "evt_first_stock",
      orderId: firstOrder.id,
      userId: user.id,
      sessionId: "cs_first_stock",
      paymentIntentId: "pi_first_stock",
    })).expect(200);

    await sendSignedEvent(checkoutCompletedEvent({
      id: "evt_second_stock",
      orderId: secondOrder.id,
      userId: user.id,
      sessionId: "cs_second_stock",
      paymentIntentId: "pi_second_stock",
    })).expect(200);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    const orders = await prisma.order.findMany({ orderBy: { id: "asc" } });

    expect(productAfter.stock).toBe(0);
    expect(orders.map((item) => item.status)).toEqual(["PAID", "REFUNDED"]);
  });
});
