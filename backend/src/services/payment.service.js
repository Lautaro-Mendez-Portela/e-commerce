const stripe = require("../config/stripe");
const prisma = require("../config/prisma");

exports.createPaymentIntent = async (
  orderId
) => {

  const order =
    await prisma.order.findUnique({

      where: {
        id: Number(orderId)
      }
    });

  if (!order) {
    throw new Error(
      "Orden no encontrada"
    );
  }

  const paymentIntent =
    await stripe.paymentIntents.create({

      amount:
        Math.round(
          order.total * 100
        ),

      currency: "usd",

      metadata: {
        orderId: String(order.id)
      },

      automatic_payment_methods: {
        enabled: true
      }
    });

  return paymentIntent;
};

exports.createCheckoutSession =
  async (orderId) => {

    const order =
      await prisma.order.findUnique({

        where: {
          id: Number(orderId)
        },

        include: {
          items: true
        }
      });

    if (!order) {
      throw new Error(
        "Orden no encontrada"
      );
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
                    `Producto ${item.productId}`
                },

                unit_amount:
                  Math.round(
                    item.price * 100
                  )
              },

              quantity:
                item.quantity
            })
          ),

        mode: "payment",

        success_url:
          "http://localhost:5173/success",

        cancel_url:
          "http://localhost:5173/cancel",

        metadata: {
          orderId:
            String(order.id)
        }

      });

    return session;
  };