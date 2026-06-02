const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

exports.register = async ({ firstName, lastName, email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error("El usuario ya existe");
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
    throw new Error("Usuario no encontrado");
  }

  if (!user.isActive) {
    throw new Error("Usuario deshabilitado");
  }

  const validPassword = await bcrypt.compare(
    password,
    user.password
  );

  if (!validPassword) {
    throw new Error("Password incorrecta");
  }

  const accessToken = jwt.sign(
    { userId: user.id,
      role: user.role
     },
    "secret",
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    "refresh_secret",
    { expiresIn: "7d" }
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
    throw new Error("Refresh token requerido");
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken
    }
  });

  if (!storedToken) {
    throw new Error("Refresh token inválido");
  }

  try {

    const decoded = jwt.verify(
      refreshToken,
      "refresh_secret"
    );

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      }
    });

    if (!user || !user.isActive) {
      throw new Error("Usuario deshabilitado");
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      "secret",
      { expiresIn: "15m" }
    );

    return { accessToken };

  } catch {
    throw new Error("Refresh token expirado");
  }
};
