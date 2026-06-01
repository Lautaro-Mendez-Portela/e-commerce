const express = require("express");

const router = express.Router();

const stripe = require("../config/stripe");
const prisma = require("../config/prisma");

router.post(
  "/webhook",

  express.raw({
    type: "application/json",
  }),

  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const orderId = session.metadata.orderId;

      if (!orderId) {
        console.log("Checkout sin orderId");

        return res.json({
          received: true,
        });
      }

      await prisma.order.update({
        where: {
          id: Number(orderId),
        },

        data: {
          status: "PAID",
        },
      });

      console.log("Orden pagada:", orderId);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("METADATA:", paymentIntent.metadata);

      const orderId = paymentIntent.metadata.orderId;

      console.log(paymentIntent.metadata);

      if (!orderId) {
        console.log("Evento sin orderId, ignorado");

        return res.json({
          received: true,
        });
      }

      await prisma.order.update({
        where: {
          id: Number(orderId),
        },

        data: {
          status: "PAID",
          paymentIntentId: paymentIntent.id,
        },
      });

      console.log("Pago exitoso:", paymentIntent.id);
    }

    res.json({
      received: true,
    });
  },
);

module.exports = router;
