const prisma = require("../config/prisma");
const AppError = require("../utils/app-error");

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
  const product = await prisma.product.findFirst({
    where: {
      id: Number(productId),
      isActive: true,
    },
  });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
  }

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
