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

const USER_ORDER_STATUS_GROUPS = {
  IN_PROGRESS: [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.PAID,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
  ],
  DELIVERED: [
    ORDER_STATUS.DELIVERED,
  ],
  CANCELLED: [
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.FAILED,
    ORDER_STATUS.REFUNDED,
  ],
};

const USER_ORDER_ITEM_INCLUDE = {
  orderBy: {
    id: "asc",
  },
  include: {
    product: {
      select: {
        id: true,
        name: true,
        imageUrl: true,
        stock: true,
        isActive: true,
      },
    },
  },
};

const ADMIN_ORDER_ITEM_SELECT = {
  id: true,
  productId: true,
  productName: true,
  quantity: true,
  price: true,
  subtotal: true,
  product: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      isActive: true,
    },
  },
};

const ADMIN_ORDER_SELECT = {
  id: true,
  status: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  cancelledAt: true,
  refundedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  items: {
    orderBy: {
      id: "asc",
    },
    select: ADMIN_ORDER_ITEM_SELECT,
  },
};

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

exports.getOrderByIdForUser = async (orderId, userId) => {
  const order = await prisma.order.findFirst({
    where: {
      id: Number(orderId),
      userId: Number(userId),
    },
    include: {
      items: USER_ORDER_ITEM_INCLUDE,
    },
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
  }

  return order;
};

exports.getAllOrders = async ({
  page,
  limit,
  skip,
  q,
  status,
  dateFrom,
  dateTo,
}) => {
  const where = status && status !== "ALL"
    ? {
        status,
      }
    : {};

  if (q) {
    const search = q.trim();
    const searchId = Number(search);

    where.OR = [
      ...(Number.isInteger(searchId) && searchId > 0
        ? [
            {
              id: searchId,
            },
          ]
        : []),
      {
        user: {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          lastName: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

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
      select: ADMIN_ORDER_SELECT,
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

exports.getOrderByIdForAdmin = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: {
      id: Number(orderId),
    },
    select: ADMIN_ORDER_SELECT,
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
  }

  return order;
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

exports.getOrdersByUser = async ({
  userId,
  page,
  limit,
  skip,
  statusGroup,
}) => {
  const where = {
    userId: Number(userId),
  };

  const statuses = USER_ORDER_STATUS_GROUPS[statusGroup];

  if (statuses) {
    where.status = {
      in: statuses,
    };
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        items: USER_ORDER_ITEM_INCLUDE,
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

exports.getAllOrdersByUser = async (userId) => {
  return prisma.order.findMany({
    where: {
      userId: Number(userId),
    },
    include: {
      items: USER_ORDER_ITEM_INCLUDE,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
