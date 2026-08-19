const prisma = require("../config/prisma");
const {
  buildPaginatedResponse
} = require("../utils/pagination");

exports.createProduct = async (data) => {
  const product = await prisma.product.create({
    data,
  });

  return product;
};

exports.getProducts = async ({
  page,
  limit,
  skip,
  name,
  minPrice,
  maxPrice,
}) => {
  const where = {
    isActive: true,
  };

  if (name) {
    where.name = {
      contains: name,
      mode: "insensitive",
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};

    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }

    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        id: "asc",
      },
    }),
    prisma.product.count({
      where,
    }),
  ]);

  return buildPaginatedResponse({
    data: products,
    total,
    page,
    limit,
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
