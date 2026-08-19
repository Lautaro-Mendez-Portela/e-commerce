const orderService = require("../services/order.service");
const {
  getPaginationParams
} = require("../utils/pagination");

exports.createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.userId);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
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
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status
    );

    res.json(order);
  } catch (error) {
    next(error);
  }
};
