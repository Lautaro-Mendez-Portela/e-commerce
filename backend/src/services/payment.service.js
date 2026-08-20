const stripe = require("../config/stripe");
const prisma = require("../config/prisma");
const env = require("../config/env");
const AppError = require("../utils/app-error");
const {
  toDecimal,
  toStripeAmount
} = require("../utils/money");
const {
  ORDER_STATUS
} = require("../utils/order-status");

const getOwnedOrder = async (orderId, userId) => {
  const order = await prisma.order.findFirst({
    where: {
      id: Number(orderId),
      userId: Number(userId)
    },
    include: {
      items: {
        orderBy: {
          id: "asc"
        }
      }
    }
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw new AppError(
      409,
      "ORDER_NOT_PAYABLE",
      "La orden no esta disponible para iniciar pago"
    );
  }

  if (order.items.length === 0) {
    throw new AppError(400, "EMPTY_ORDER", "La orden no tiene items");
  }

  if (toDecimal(order.total).lte(0)) {
    throw new AppError(400, "INVALID_ORDER_TOTAL", "Total de orden invalido");
  }

  return order;
};

const getPaymentIntentId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id || null;
};

const getCheckoutSessionExpiresAt = (session) => {
  if (!session.expires_at) {
    return null;
  }

  return new Date(session.expires_at * 1000);
};

const isMissingStripeResource = (error) => {
  return error.code === "resource_missing" || error.statusCode === 404;
};

const isReusableCheckoutSession = (session) => {
  const expiresAt = getCheckoutSessionExpiresAt(session);

  return session.status === "open" &&
    session.url &&
    (!expiresAt || expiresAt > new Date());
};

const getReusableCheckoutSession = async (order) => {
  if (!order.stripeCheckoutSessionId) {
    return {
      session: null,
      attempt: order.stripeCheckoutSessionAttempt || 0,
    };
  }

  let session;

  try {
    session = await stripe.checkout.sessions.retrieve(
      order.stripeCheckoutSessionId
    );
  } catch (error) {
    if (isMissingStripeResource(error)) {
      return {
        session: null,
        attempt: (order.stripeCheckoutSessionAttempt || 0) + 1,
      };
    }

    throw error;
  }

  if (isReusableCheckoutSession(session)) {
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        stripeCheckoutSessionUrl: session.url,
        stripeCheckoutSessionExpiresAt: getCheckoutSessionExpiresAt(session),
        stripePaymentIntentId:
          getPaymentIntentId(session.payment_intent) ||
          order.stripePaymentIntentId,
      },
    });

    return {
      session,
      attempt: order.stripeCheckoutSessionAttempt || 0,
    };
  }

  if (session.status === "complete") {
    throw new AppError(
      409,
      "CHECKOUT_ALREADY_COMPLETED",
      "La sesion de pago ya fue completada y esta pendiente de confirmacion"
    );
  }

  return {
    session: null,
    attempt: (order.stripeCheckoutSessionAttempt || 0) + 1,
  };
};

const buildClientUrl = (path) => {
  return `${env.clientUrl.replace(/\/+$/, "")}${path}`;
};

exports.createPaymentIntent = async (
  orderId,
  userId
) => {

  const order =
    await getOwnedOrder(orderId, userId);

  if (order.stripePaymentIntentId) {
    return stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
  }

  const paymentIntent =
    await stripe.paymentIntents.create({

      amount: toStripeAmount(order.total),

      currency: "usd",

      metadata: {
        orderId: String(order.id),
        userId: String(order.userId)
      },

      automatic_payment_methods: {
        enabled: true
      }
    }, {
      idempotencyKey: `payment_intent_order_${order.id}`
    });

  await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  return paymentIntent;
};

exports.createCheckoutSession =
  async (orderId, userId) => {

    const order =
      await getOwnedOrder(orderId, userId);

    const reusableCheckout = await getReusableCheckoutSession(order);

    if (reusableCheckout.session) {
      return reusableCheckout.session;
    }

    const session =
      await stripe.checkout.sessions.create({

        payment_method_types: [
          "card"
        ],

        line_items:
          order.items.map(
            (item) => ({
              price_data: {

                currency: "usd",

                product_data: {
                  name:
                    item.productName || `Producto ${item.productId}`
                },

                unit_amount: toStripeAmount(item.price)
              },

              quantity:
                item.quantity
            })
          ),

        mode: "payment",

        success_url:
          buildClientUrl(
            `/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`
          ),

        cancel_url:
          buildClientUrl(`/checkout/cancel?orderId=${order.id}`),

        client_reference_id:
          String(order.id),

        payment_intent_data: {
          metadata: {
            orderId:
              String(order.id),
            userId:
              String(order.userId)
          }
        },

        metadata: {
          orderId:
            String(order.id),
          userId:
            String(order.userId)
        }

      }, {
        idempotencyKey:
          `checkout_session_order_${order.id}_attempt_${reusableCheckout.attempt}`
      });

    await prisma.order.update({
      where: {
        id: order.id
      },
      data: {
        stripeCheckoutSessionId: session.id,
        stripeCheckoutSessionUrl: session.url,
        stripeCheckoutSessionExpiresAt: getCheckoutSessionExpiresAt(session),
        stripeCheckoutSessionAttempt: reusableCheckout.attempt,
        stripePaymentIntentId:
          getPaymentIntentId(session.payment_intent) ||
          order.stripePaymentIntentId,
      }
    });

    return session;
  };
