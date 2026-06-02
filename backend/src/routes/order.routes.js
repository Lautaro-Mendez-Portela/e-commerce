const express = require("express");

const router = express.Router();

const orderController = require("../controllers/order.controller");

const { authMiddleware } = require("../middlewares/auth.middleware");

const { roleMiddleware } = require("../middlewares/role.middleware");

router.post("/", authMiddleware, orderController.createOrder);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  orderController.getAllOrders
);

module.exports = router;
