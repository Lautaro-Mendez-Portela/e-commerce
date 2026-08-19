const prisma = require("../config/prisma");
const AppError = require("../utils/app-error");

const assertPositiveInteger = (value, fieldName) => {
  if (!Number.isInteger(value) || value < 1) {
    throw new AppError(
      400,
      "INVALID_CART_QUANTITY",
      `${fieldName} debe ser un entero mayor a 0`
    );
  }
};

const getActiveProduct = async (productId) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true
    }
  });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
  }

  return product;
};

exports.addToCart = async (
  userId,
  productId,
  quantity
) => {
  assertPositiveInteger(productId, "productId");
  assertPositiveInteger(quantity, "quantity");

  const product = await getActiveProduct(productId);

  const existingItem =
    await prisma.cartItem.findFirst({

      where: {
        userId,
        productId
      }
    });

  if (existingItem) {
    const nextQuantity = existingItem.quantity + quantity;

    if (nextQuantity > product.stock) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK",
        "La cantidad solicitada supera el stock disponible"
      );
    }

    return prisma.cartItem.update({

      where: {
        id: existingItem.id
      },

      data: {
        quantity: nextQuantity
      }
    });
  }

  if (quantity > product.stock) {
    throw new AppError(
      409,
      "INSUFFICIENT_STOCK",
      "La cantidad solicitada supera el stock disponible"
    );
  }

  return prisma.cartItem.create({

    data: {
      userId,
      productId,
      quantity
    }
  });
};

exports.getCart = async (
  userId
) => {

  return prisma.cartItem.findMany({

    where: {
      userId,
      product: {
        isActive: true
      }
    },

    include: {
      product: true
    }
  });
};

exports.removeFromCart = async (
  id,
  userId
) => {
  assertPositiveInteger(id, "id");

  const deleted = await prisma.cartItem.deleteMany({

    where: {
      id,
      userId
    }
  });

  if (deleted.count === 0) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Item de carrito no encontrado");
  }

  return deleted;
};

exports.updateQuantity = async (
  id,
  userId,
  quantity
) => {
  assertPositiveInteger(id, "id");
  assertPositiveInteger(quantity, "quantity");

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      id,
      userId
    },
    include: {
      product: true
    }
  });

  if (!existingItem || !existingItem.product?.isActive) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Item de carrito no encontrado");
  }

  if (quantity > existingItem.product.stock) {
    throw new AppError(
      409,
      "INSUFFICIENT_STOCK",
      "La cantidad solicitada supera el stock disponible"
    );
  }

  return prisma.cartItem.update({

    where: {
      id
    },

    data: {
      quantity
    }
  });
};
