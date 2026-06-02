const prisma = require("../config/prisma");
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
      throw new Error("Carrito vacío");
    }

    let total = 0;

    const orderItemsData = [];

    for (const item of cartItems) {
      const product = item.product;

      if (!product) {
        throw new Error("Producto no encontrado");
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }

      total += product.price * item.quantity;

      orderItemsData.push({
        productId: product.id,

        quantity: item.quantity,

        price: product.price,
      });
    }

    const order = await tx.order.create({
      data: {
        userId,

        total,

        items: {
          create: orderItemsData,
        },
      },

      include: {
        items: true,
      },
    });

    for (const item of cartItems) {
      await tx.product.update({
        where: {
          id: item.productId,
        },

        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        userId,
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
