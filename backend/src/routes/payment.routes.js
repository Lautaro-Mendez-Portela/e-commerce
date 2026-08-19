const express = require("express");

const router = express.Router();

const paymentController = require(
  "../controllers/payment.controller"
);

const {
  authMiddleware
} = require("../middlewares/auth.middleware");
const {
  validate
} = require("../middlewares/validation.middleware");
const {
  paymentOrderSchema
} = require("../validators/payment.validator");

router.post(
  "/checkout",
  authMiddleware,
  validate({
    body: paymentOrderSchema
  }),
  paymentController.checkout
);

router.post(
  "/checkout-session",
  authMiddleware,
  validate({
    body: paymentOrderSchema
  }),
  paymentController.createCheckoutSession
);

module.exports = router;
