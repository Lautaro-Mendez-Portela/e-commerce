const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const AppError = require("../utils/app-error");
const {
  buildPaginatedResponse
} = require("../utils/pagination");

exports.getUsers = async ({
  page,
  limit,
  skip,
  search,
  role,
  isActive,
}) => {
  const where = {};

  if (role && role !== "ALL") {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        firstName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        lastName: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

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
        isActive: true,
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

const countActiveAdmins = async () => {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
    },
  });
};

const getTargetUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }

  return user;
};

exports.updateUserRole = async ({
  actorUserId,
  targetUserId,
  role,
}) => {
  const targetUser = await getTargetUser(targetUserId);

  if (Number(actorUserId) === targetUser.id && role !== "ADMIN") {
    throw new AppError(
      400,
      "CANNOT_CHANGE_OWN_ADMIN_ROLE",
      "No puedes quitarte tu propio rol administrador"
    );
  }

  if (targetUser.role === "ADMIN" && role !== "ADMIN" && targetUser.isActive) {
    const activeAdmins = await countActiveAdmins();

    if (activeAdmins <= 1) {
      throw new AppError(
        409,
        "LAST_ADMIN_REQUIRED",
        "Debe quedar al menos un administrador activo"
      );
    }
  }

  return prisma.user.update({
    where: {
      id: targetUser.id,
    },
    data: {
      role,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};

exports.updateUserStatus = async ({
  actorUserId,
  targetUserId,
  isActive,
}) => {
  const targetUser = await getTargetUser(targetUserId);

  if (Number(actorUserId) === targetUser.id && !isActive) {
    throw new AppError(
      400,
      "CANNOT_DISABLE_SELF",
      "No puedes desactivar tu propio usuario"
    );
  }

  if (targetUser.role === "ADMIN" && targetUser.isActive && !isActive) {
    const activeAdmins = await countActiveAdmins();

    if (activeAdmins <= 1) {
      throw new AppError(
        409,
        "LAST_ADMIN_REQUIRED",
        "Debe quedar al menos un administrador activo"
      );
    }
  }

  return prisma.user.update({
    where: {
      id: targetUser.id,
    },
    data: {
      isActive,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};

exports.changePassword = async (
  userId,
  {
    currentPassword,
    newPassword,
  }
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!passwordMatches) {
    throw new AppError(
      401,
      "INVALID_CURRENT_PASSWORD",
      "La contrasena actual no es correcta"
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: "Contrasena actualizada",
  };
};
