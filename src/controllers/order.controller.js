const orderService = require("../services/order.service");

exports.createOrder = async (req, res) => {

  try {

    const order = await orderService.createOrder(
      req.user.userId,
      req.body.items
    );

    res.status(201).json(order);

  } catch (error) {

    res.status(400).json({
      error: error.message
    });

  }
};