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

exports.createPaymentIntent = async (
  orderId,
  userId
) => {

  const order =
    await getOwnedOrder(orderId, userId);

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
    });

  return paymentIntent;
};

exports.createCheckoutSession =
  async (orderId, userId) => {

    const order =
      await getOwnedOrder(orderId, userId);

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
          `${env.clientUrl}/success?orderId=${order.id}`,

        cancel_url:
          `${env.clientUrl}/cancel?orderId=${order.id}`,

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

      });

    await prisma.order.update({
      where: {
        id: order.id
      },
      data: {
        stripeCheckoutSessionId: session.id
      }
    });

    return session;
  };
