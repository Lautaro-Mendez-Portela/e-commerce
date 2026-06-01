const express = require("express");

const router = express.Router();

const cartController = require(
  "../controllers/cart.controller"
);

const {
  authMiddleware
} = require("../middlewares/auth.middleware");

router.post(
  "/",
  authMiddleware,
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
  cartController.removeFromCart
);

router.put(
  "/:id",
  authMiddleware,
  cartController.updateQuantity
);
module.exports = router;