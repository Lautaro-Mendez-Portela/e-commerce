const prisma = require("../config/prisma");

exports.getAdminDashboard = async () => {
  const [
    salesAggregate,
    orderCount,
    registeredUsers,
    lowStockProducts,
    lastPurchase,
    paidOrderItems,
  ] = await prisma.$transaction([
    prisma.order.aggregate({
      where: {
        status: "PAID",
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.count(),
    prisma.user.count({
      where: {
        isActive: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          lte: 10,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
      orderBy: {
        stock: "asc",
      },
    }),
    prisma.order.findFirst({
      where: {
        status: "PAID",
      },
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
    prisma.orderItem.findMany({
      where: {
        order: {
          status: "PAID",
        },
      },
      select: {
        productId: true,
        quantity: true,
      },
    }),
  ]);

  const quantityByProduct = paidOrderItems.reduce((acc, item) => {
    acc[item.productId] = (acc[item.productId] || 0) + item.quantity;

    return acc;
  }, {});

  const topProductEntry = Object.entries(quantityByProduct)
    .sort((first, second) => second[1] - first[1])[0];

  const topProduct = topProductEntry
    ? await prisma.product.findUnique({
        where: {
          id: Number(topProductEntry[0]),
        },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
        },
      })
    : null;

  return {
    totalSales: salesAggregate._sum.total || 0,
    orderCount,
    registeredUsers,
    lowStockProducts,
    lastPurchase,
    topSellingProduct: topProduct
      ? {
          ...topProduct,
          quantitySold: topProductEntry[1],
        }
      : null,
  };
};
