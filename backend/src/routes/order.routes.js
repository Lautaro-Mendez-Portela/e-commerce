const express = require("express");

const router = express.Router();

const orderController = require("../controllers/order.controller");

const { authMiddleware } = require("../middlewares/auth.middleware");

const { roleMiddleware } = require("../middlewares/role.middleware");
const {
  validate
} = require("../middlewares/validation.middleware");
const {
  adminOrdersQuerySchema,
  orderParamsSchema,
  updateOrderStatusSchema
} = require("../validators/order.validator");

router.post("/", authMiddleware, orderController.createOrder);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    query: adminOrdersQuerySchema
  }),
  orderController.getAllOrders
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    params: orderParamsSchema,
    body: updateOrderStatusSchema
  }),
  orderController.updateOrderStatus
);

router.get(
  "/:id",
  authMiddleware,
  validate({
    params: orderParamsSchema
  }),
  orderController.getMyOrderById
);

module.exports = router;
