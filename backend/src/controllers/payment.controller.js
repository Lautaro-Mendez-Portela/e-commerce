const paymentService = require("../services/payment.service");

exports.checkout = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const paymentIntent = await paymentService.createPaymentIntent(
      orderId,
      req.user.userId
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};

exports.createCheckoutSession = async (
  req,
  res,
  next
) => {

  try {

    const { orderId } = req.body;

    const session =
      await paymentService.createCheckoutSession(
        orderId,
        req.user.userId
      );

    res.json({
      url: session.url
    });

  } catch (error) {
    next(error);

  }

};
