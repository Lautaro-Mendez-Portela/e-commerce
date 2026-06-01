const prisma = require("../config/prisma");

exports.createProduct = async (data) => {

  const product = await prisma.product.create({
    data
  });

  return product;
};

exports.getProducts = async () => {

  return await prisma.product.findMany();

};