const prisma = require("../config/prisma");

exports.getFavorites = async (userId) => {
  return await prisma.favorite.findMany({
    where: {
      userId: Number(userId),
      product: {
        isActive: true,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

exports.addFavorite = async (userId, productId) => {
  return await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: Number(userId),
        productId: Number(productId),
      },
    },
    update: {},
    create: {
      userId: Number(userId),
      productId: Number(productId),
    },
    include: {
      product: true,
    },
  });
};

exports.removeFavorite = async (userId, productId) => {
  return await prisma.favorite.deleteMany({
    where: {
      userId: Number(userId),
      productId: Number(productId),
    },
  });
};
