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
  createProductSchema,
  productParamsSchema,
  productQuerySchema,
  updateProductSchema
} = require("../validators/product.validator");

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    params: productParamsSchema
  }),
  productController.deleteProduct
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    params: productParamsSchema,
    body: updateProductSchema
  }),
  productController.updateProduct
);

router.post(
  "/",

  authMiddleware,

  roleMiddleware("ADMIN"),

  validate({
    body: createProductSchema
  }),

  productController.createProduct
);

router.get(
  "/",
  validate({
    query: productQuerySchema
  }),
  productController.getProducts
);

router.get(
  "/:id",
  validate({
    params: productParamsSchema
  }),
  productController.getProductById
);

module.exports = router;
