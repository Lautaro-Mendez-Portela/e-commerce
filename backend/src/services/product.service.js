const prisma = require("../config/prisma");
const AppError = require("../utils/app-error");
const {
  buildPaginatedResponse
} = require("../utils/pagination");

const PRODUCT_PUBLIC_SELECT = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  price: true,
  stock: true,
  createdAt: true,
};

const PRODUCT_ADMIN_SELECT = {
  ...PRODUCT_PUBLIC_SELECT,
  isActive: true,
};

const buildProductOrderBy = (sort) => {
  switch (sort) {
    case "newest":
      return {
        createdAt: "desc",
      };
    case "price_asc":
      return {
        price: "asc",
      };
    case "price_desc":
      return {
        price: "desc",
      };
    case "name_asc":
      return {
        name: "asc",
      };
    case "stock_asc":
      return {
        stock: "asc",
      };
    case "stock_desc":
      return {
        stock: "desc",
      };
    default:
      return {
        id: "asc",
      };
  }
};

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
  search,
  minPrice,
  maxPrice,
  inStock,
  sort,
}) => {
  const where = {
    isActive: true,
  };

  const searchTerm = search || name;

  if (searchTerm) {
    where.OR = [
      {
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ];
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

  if (inStock !== undefined) {
    where.stock = inStock
      ? {
          gt: 0,
        }
      : 0;
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildProductOrderBy(sort),
      select: PRODUCT_PUBLIC_SELECT,
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

exports.getProductById = async (id) => {
  const product = await prisma.product.findFirst({
    where: {
      id: Number(id),
      isActive: true,
    },
    select: PRODUCT_PUBLIC_SELECT,
  });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
  }

  return product;
};

exports.getAdminProducts = async ({
  page,
  limit,
  skip,
  search,
  status,
  stockFilter,
  sort,
}) => {
  const where = {};

  if (status === "ACTIVE") {
    where.isActive = true;
  }

  if (status === "INACTIVE") {
    where.isActive = false;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (stockFilter === "LOW") {
    where.stock = {
      gt: 0,
      lte: 5,
    };
  }

  if (stockFilter === "OUT") {
    where.stock = 0;
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildProductOrderBy(sort),
      select: PRODUCT_ADMIN_SELECT,
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

exports.updateProductStock = async (id, stock) => {
  const product = await prisma.product.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
  }

  return prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      stock,
    },
    select: PRODUCT_ADMIN_SELECT,
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
