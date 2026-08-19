const cartService = require(
  "../services/cart.service"
);

exports.addToCart = async (
  req,
  res,
  next
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
    next(error);
  }
};

exports.getCart = async (
  req,
  res,
  next
) => {

  try {

    const cart =
      await cartService.getCart(
        req.user.userId
      );

    res.json(cart);

  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (
  req,
  res,
  next
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
    next(error);
  }
};

exports.updateQuantity = async (
  req,
  res,
  next
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
    next(error);
  }
};
