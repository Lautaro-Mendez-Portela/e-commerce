const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../config/prisma");
const AppError = require("../utils/app-error");

exports.authMiddleware = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError(401, "TOKEN_REQUIRED", "Token requerido"));
  }

  if (!authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "INVALID_TOKEN", "Token invalido"));
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      env.jwtSecret
    );

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return next(new AppError(401, "INVALID_TOKEN", "Token invalido"));
    }

    req.user = {
      userId: user.id,
      role: user.role
    };

    next();

  } catch {
    return next(new AppError(401, "INVALID_TOKEN", "Token invalido"));
  }
};
