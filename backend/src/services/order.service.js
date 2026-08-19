const prisma = require("../config/prisma");
const AppError = require("../utils/app-error");
const {
  addMoney,
  multiplyMoney,
  toDecimal
} = require("../utils/money");
const {
  ORDER_STATUS,
  assertOrderTransition
} = require("../utils/order-status");
const {
  buildPaginatedResponse
} = require("../utils/pagination");


exports.createOrder = async (userId) => {
  return await prisma.$transaction(async (tx) => {
    const cartItems = await tx.cartItem.findMany({
      where: {
        userId,
      },

      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      throw new AppError(400, "EMPTY_CART", "Carrito vacio");
    }

    let total = toDecimal(0);

    const orderItemsData = [];

    for (const item of cartItems) {
      const product = item.product;

      if (!product) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new AppError(
          400,
          "INVALID_CART_QUANTITY",
          "El carrito contiene cantidades invalidas"
        );
      }

      if (!product.isActive) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          409,
          "INSUFFICIENT_STOCK",
          `Stock insuficiente para ${product.name}`
        );
      }

      const subtotal = multiplyMoney(product.price, item.quantity);

      total = addMoney(total, subtotal);

      orderItemsData.push({
        productId: product.id,
        cartItemId: item.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal,
      });
    }

    const order = await tx.order.create({
      data: {
        userId,

        total,
        status: ORDER_STATUS.PENDING,

        items: {
          create: orderItemsData,
        },
      },

      include: {
        items: true,
      },
    });

    return order;
  });
};

exports.getAllOrders = async ({
  page,
  limit,
  skip,
  status,
  dateFrom,
  dateTo,
}) => {
  const where = status && status !== "ALL"
    ? {
        status,
      }
    : {};

  if (dateFrom || dateTo) {
    where.createdAt = {};

    if (dateFrom) {
      where.createdAt.gte = new Date(`${dateFrom}T00:00:00.000Z`);
    }

    if (dateTo) {
      where.createdAt.lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.order.count({
      where,
    }),
  ]);

  return buildPaginatedResponse({
    data: orders,
    total,
    page,
    limit,
  });
};

exports.updateOrderStatus = async (orderId, nextStatus) => {
  const order = await prisma.order.findUnique({
    where: {
      id: Number(orderId),
    },
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
  }

  assertOrderTransition(order.status, nextStatus, "ADMIN");

  return prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: nextStatus,
      cancelledAt: nextStatus === ORDER_STATUS.CANCELLED
        ? new Date()
        : order.cancelledAt,
    },
  });
};

exports.getOrdersByUser = async (userId) => {
  return await prisma.order.findMany({
    where: {
      userId: Number(userId),
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
