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

exports.getMyOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderByIdForUser(
      req.params.id,
      req.user.userId
    );

    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const orders = await orderService.getOrdersByUser({
      ...pagination,
      userId: req.user.userId,
      statusGroup: req.query.statusGroup,
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const orders = await orderService.getAllOrders({
      ...pagination,
      q: req.query.q,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getAdminOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderByIdForAdmin(req.params.id);

    res.json(order);
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
