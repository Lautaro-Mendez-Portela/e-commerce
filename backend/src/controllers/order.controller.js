const orderService = require("../services/order.service");
const {
  getPaginationParams
} = require("../utils/pagination");

exports.createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user.userId);

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const pagination = getPaginationParams(req.query);
    const orders = await orderService.getAllOrders({
      ...pagination,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    res.json(orders);
  } catch (error) {
    console.error("ERROR GET ORDERS:", error);
    res.status(500).json({
      message: "Error al obtener las órdenes",
    });
  }
};
