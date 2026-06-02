const prisma = require("../config/prisma");

exports.createProduct = async (data) => {
  const product = await prisma.product.create({
    data,
  });

  return product;
};

exports.getProducts = async () => {
  return await prisma.product.findMany({
    where: {
      isActive: true,
    },
  });
};

exports.deleteProduct = async (id) => {
  return await prisma.product.update({
    where: {
      id: Number(id),
    },
    data: {
      isActive: false,
    },
  });
};

exports.updateProduct = async (id, data) => {
  return await prisma.product.update({
    where: {
      id: Number(id),
    },

    data,
  });
};