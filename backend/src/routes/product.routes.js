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

const {
  validate
} = require("../middlewares/validation.middleware");

const {
  createProductSchema
} = require("../validators/product.validator");

router.post(
  "/",

  authMiddleware,

  roleMiddleware("ADMIN"),

  validate(createProductSchema),

  productController.createProduct
);

router.get(
  "/",
  productController.getProducts
);

module.exports = router;