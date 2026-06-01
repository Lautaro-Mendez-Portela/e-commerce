const prisma = require("../config/prisma");

exports.addToCart = async (
  userId,
  productId,
  quantity
) => {

  const existingItem =
    await prisma.cartItem.findFirst({

      where: {
        userId,
        productId
      }
    });

  if (existingItem) {

    return prisma.cartItem.update({

      where: {
        id: existingItem.id
      },

      data: {
        quantity:
          existingItem.quantity + quantity
      }
    });
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
      userId
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

  return prisma.cartItem.delete({

    where: {
      id,
      userId
    }
  });
};

exports.updateQuantity = async (
  id,
  userId,
  quantity
) => {

  return prisma.cartItem.update({

    where: {
      id,
      userId
    },

    data: {
      quantity
    }
  });
};