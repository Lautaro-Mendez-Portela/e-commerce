const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const env = require("../config/env");
const AppError = require("../utils/app-error");

exports.register = async ({ firstName, lastName, email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError(409, "USER_ALREADY_EXISTS", "El usuario ya existe");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword
    }
  });

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  };
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales invalidas");
  }

  if (!user.isActive) {
    throw new AppError(403, "ACCOUNT_DISABLED", "Usuario deshabilitado");
  }

  const validPassword = await bcrypt.compare(
    password,
    user.password
  );

  if (!validPassword) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales invalidas");
  }

  const accessToken = jwt.sign(
    { userId: user.id,
      role: user.role
     },
    env.jwtSecret,
    { expiresIn: env.accessTokenExpiresIn }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenExpiresIn }
  );

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id
    }
  });

  return {
    accessToken,
    refreshToken
  };
};

exports.refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError(400, "REFRESH_TOKEN_REQUIRED", "Refresh token requerido");
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken
    }
  });

  if (!storedToken) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token invalido");
  }

  try {

    const decoded = jwt.verify(
      refreshToken,
      env.jwtRefreshSecret
    );

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      }
    });

    if (!user || !user.isActive) {
      throw new AppError(403, "ACCOUNT_DISABLED", "Usuario deshabilitado");
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      env.jwtSecret,
      { expiresIn: env.accessTokenExpiresIn }
    );

    return { accessToken };

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      401,
      "REFRESH_TOKEN_EXPIRED",
      "Refresh token expirado"
    );
  }
};
