const prisma = require("../config/prisma");

exports.getUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};