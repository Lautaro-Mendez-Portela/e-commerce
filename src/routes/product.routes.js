const express = require("express");

const router = express.Router();

const productController = require(
  "../controllers/product.controller"
);

const {
  authMiddleware
} = require("../middlewares/auth.middleware");

const {
  roleMiddleware
} = require("../middlewares/role.middleware");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  productController.createProduct
);

router.get(
  "/",
  productController.getProducts
);

module.exports = router;