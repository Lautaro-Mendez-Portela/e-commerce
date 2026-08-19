const express = require("express");

const router = express.Router();

const stripe = require("../config/stripe");
const env = require("../config/env");
const AppError = require("../utils/app-error");
const stripeWebhookService = require("../services/stripe-webhook.service");

router.post(
  "/webhook",

  express.raw({
    type: "application/json",
  }),

  async (req, res, next) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        env.stripeWebhookSecret,
      );
    } catch (err) {
      return next(
        new AppError(
          400,
          "INVALID_WEBHOOK_SIGNATURE",
          "Firma de webhook invalida"
        )
      );
    }

    try {
      const result = await stripeWebhookService.handleStripeEvent(event);

      res.json({
        received: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
