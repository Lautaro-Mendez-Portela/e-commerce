const paymentService = require("../services/payment.service");

exports.checkout = async (req, res) => {
  try {
    console.log(req.body);


    const { orderId } = req.body;

    const paymentIntent = await paymentService.createPaymentIntent(orderId);

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.createCheckoutSession = async (
  req,
  res
) => {

  try {

    const { orderId } = req.body;

    const session =
      await paymentService.createCheckoutSession(
        orderId
      );

    res.json({
      url: session.url
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};
