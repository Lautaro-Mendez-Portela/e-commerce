const prisma = require("../config/prisma");
const {
  buildPaginatedResponse
} = require("../utils/pagination");

exports.getUsers = async ({ page, limit, skip }) => {
  const where = {
    isActive: true,
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        id: "asc",
      },
    }),
    prisma.user.count({
      where,
    }),
  ]);

  return buildPaginatedResponse({
    data: users,
    total,
    page,
    limit,
  });
};

exports.getUserProfile = async (userId, { page, limit, skip }) => {
  const id = Number(userId);

  const [user, orders, totalOrders] = await prisma.$transaction([
    prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: {
        userId: id,
      },
      skip,
      take: limit,
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
    }),
    prisma.order.count({
      where: {
        userId: id,
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  const ordersResponse = buildPaginatedResponse({
    data: orders,
    total: totalOrders,
    page,
    limit,
  });

  return {
    ...user,
    orders: ordersResponse.data,
    ordersPagination: ordersResponse.pagination,
  };
};

exports.deleteUser = async (id) => {
  return await prisma.user.update({
    where: {
      id: Number(id),
    },
    data: {
      isActive: false,
    },
  });
};
