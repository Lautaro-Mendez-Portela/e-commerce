const express = require("express");

const router = express.Router();

const paymentController = require(
  "../controllers/payment.controller"
);

const {
  authMiddleware
} = require("../middlewares/auth.middleware");

router.post(
  "/checkout",
  authMiddleware,
  paymentController.checkout
);

router.post(
  "/checkout-session",
  authMiddleware,
  paymentController.createCheckoutSession
);

module.exports = router;