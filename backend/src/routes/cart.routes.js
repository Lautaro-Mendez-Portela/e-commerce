const express = require("express");

const router = express.Router();

const cartController = require(
  "../controllers/cart.controller"
);

const {
  authMiddleware
} = require("../middlewares/auth.middleware");
const {
  validate
} = require("../middlewares/validation.middleware");
const {
  cartItemParamsSchema,
  cartItemSchema,
  cartQuantitySchema
} = require("../validators/cart.validator");

router.post(
  "/",
  authMiddleware,
  validate({
    body: cartItemSchema
  }),
  cartController.addToCart
);

router.get(
  "/",
  authMiddleware,
  cartController.getCart
);

router.delete(
  "/:id",
  authMiddleware,
  validate({
    params: cartItemParamsSchema
  }),
  cartController.removeFromCart
);

router.put(
  "/:id",
  authMiddleware,
  validate({
    params: cartItemParamsSchema,
    body: cartQuantitySchema
  }),
  cartController.updateQuantity
);
module.exports = router;
