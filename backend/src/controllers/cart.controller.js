const cartService = require(
  "../services/cart.service"
);

exports.addToCart = async (
  req,
  res
) => {

  try {

    const { productId, quantity } =
      req.body;

    const item =
      await cartService.addToCart(

        req.user.userId,

        productId,

        quantity
      );

    res.json(item);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getCart = async (
  req,
  res
) => {

  try {

    const cart =
      await cartService.getCart(
        req.user.userId
      );

    res.json(cart);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
};

exports.removeFromCart = async (
  req,
  res
) => {

  try {

    await cartService.removeFromCart(

      Number(req.params.id),

      req.user.userId
    );

    res.json({
      message:
        "Producto eliminado del carrito"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
};

exports.updateQuantity = async (
  req,
  res
) => {

  try {

    const item =
      await cartService.updateQuantity(

        Number(req.params.id),

        req.user.userId,

        req.body.quantity
      );

    res.json(item);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
};