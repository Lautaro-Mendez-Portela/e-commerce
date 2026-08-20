const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

const REVENUE_STATUSES = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const LOW_STOCK_THRESHOLD = 5;

const getDateKey = (date) => date.toISOString().slice(0, 10);

const buildDailySalesSeries = (rows, days) => {
  const totalsByDate = new Map(
    rows.map((row) => [
      getDateKey(new Date(row.date)),
      {
        total: Number(row.total || 0),
        orderCount: Number(row.orderCount || 0),
      },
    ])
  );

  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();

    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));

    const key = getDateKey(date);
    const row = totalsByDate.get(key);

    return {
      date: key,
      total: row?.total || 0,
      orderCount: row?.orderCount || 0,
    };
  });
};

const mapStatusCounts = (rows) => {
  return rows.reduce((acc, row) => {
    acc[row.status] = row._count._all;

    return acc;
  }, {});
};

exports.getAdminDashboard = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const [
    salesAggregate,
    salesLast7DaysAggregate,
    orderCount,
    ordersLast7Days,
    registeredUsers,
    productCount,
    lowStockProducts,
    lastPurchase,
    statusCounts,
    topSellingProducts,
    dailySalesRows,
  ] = await prisma.$transaction([
    prisma.order.aggregate({
      where: {
        status: {
          in: REVENUE_STATUSES,
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.aggregate({
      where: {
        status: {
          in: REVENUE_STATUSES,
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.count(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
    prisma.user.count({
      where: {
        isActive: true,
      },
    }),
    prisma.product.count({
      where: {
        isActive: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          lte: LOW_STOCK_THRESHOLD,
        },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        stock: true,
      },
      orderBy: {
        stock: "asc",
      },
      take: 8,
    }),
    prisma.order.findFirst({
      where: {
        status: {
          in: REVENUE_STATUSES,
        },
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
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          status: {
            in: REVENUE_STATUSES,
          },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 1,
    }),
    prisma.$queryRaw`
      SELECT
        DATE("createdAt") AS "date",
        COALESCE(SUM("total"), 0) AS "total",
        COUNT(*)::int AS "orderCount"
      FROM "Order"
      WHERE "status"::text IN (${Prisma.join(REVENUE_STATUSES)})
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `,
  ]);

  const topProductEntry = topSellingProducts[0];
  const topProduct = topProductEntry
    ? await prisma.product.findUnique({
        where: {
          id: topProductEntry.productId,
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
    revenueStatuses: REVENUE_STATUSES,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    totalSales: salesAggregate._sum.total || 0,
    salesLast7Days: salesLast7DaysAggregate._sum.total || 0,
    orderCount,
    ordersLast7Days,
    registeredUsers,
    productCount,
    lowStockProducts,
    lastPurchase,
    statusCounts: mapStatusCounts(statusCounts),
    dailySales: buildDailySalesSeries(dailySalesRows, 30),
    topSellingProduct: topProduct
      ? {
          ...topProduct,
          quantitySold: topProductEntry._sum.quantity || 0,
        }
      : null,
  };
};
