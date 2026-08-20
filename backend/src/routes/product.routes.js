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
  adminProductQuerySchema,
  createProductSchema,
  productParamsSchema,
  productQuerySchema,
  updateProductStockSchema,
  updateProductSchema
} = require("../validators/product.validator");

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    query: adminProductQuerySchema
  }),
  productController.getAdminProducts
);

router.patch(
  "/:id/stock",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    params: productParamsSchema,
    body: updateProductStockSchema
  }),
  productController.updateProductStock
);

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
