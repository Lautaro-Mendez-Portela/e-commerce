const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const assertSafeTestDatabase = () => {
  const databaseUrl = process.env.DATABASE_URL_TEST;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL_TEST es obligatorio para tests de integracion. No se usara la DB normal."
    );
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL_TEST no es una URL valida de PostgreSQL.");
  }

  const databaseName = parsedUrl.pathname.replace("/", "").toLowerCase();

  if (!databaseName.includes("test")) {
    throw new Error(
      `DATABASE_URL_TEST debe apuntar a una base de test. DB actual: ${databaseName || "(sin nombre)"}`
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Los tests de integracion no pueden correr con NODE_ENV=production.");
  }

  process.env.DATABASE_URL = databaseUrl;
};

assertSafeTestDatabase();

const prisma = require("../../src/config/prisma");

const resetTestDatabase = async () => {
  await prisma.$transaction([
    prisma.stripeEvent.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

const uniqueEmail = (prefix = "user") => {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@test.local`;
};

const createTestUser = async ({
  firstName = "Test",
  lastName = "User",
  email = uniqueEmail("user"),
  password = "Password123!",
  role = "USER",
  isActive = true,
} = {}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isActive,
    },
  });

  return {
    ...user,
    plainPassword: password,
  };
};

const createAdminUser = (overrides = {}) => {
  return createTestUser({
    firstName: "Admin",
    lastName: "User",
    email: uniqueEmail("admin"),
    role: "ADMIN",
    ...overrides,
  });
};

const createProduct = ({
  name = "Producto Test",
  description = "Producto usado en tests automatizados",
  imageUrl = "https://example.com/product.png",
  price = "25.50",
  stock = 10,
  isActive = true,
} = {}) => {
  return prisma.product.create({
    data: {
      name,
      description,
      imageUrl,
      price,
      stock,
      isActive,
    },
  });
};

const createCartItem = ({
  userId,
  productId,
  quantity = 1,
}) => {
  return prisma.cartItem.create({
    data: {
      userId,
      productId,
      quantity,
    },
  });
};

const createOrder = async ({
  userId,
  status = "PENDING",
  items = [],
  total,
  stripePaymentIntentId,
  stripeCheckoutSessionId,
  stripeCheckoutSessionUrl,
  stripeCheckoutSessionExpiresAt,
  stripeCheckoutSessionAttempt,
} = {}) => {
  const orderItems = items.length > 0 ? items : [];
  const computedTotal = orderItems.reduce((sum, item) => {
    return sum + Number(item.price) * item.quantity;
  }, 0);

  return prisma.order.create({
    data: {
      userId,
      status,
      total: total ?? computedTotal.toFixed(2),
      stripePaymentIntentId,
      stripeCheckoutSessionId,
      stripeCheckoutSessionUrl,
      stripeCheckoutSessionExpiresAt,
      stripeCheckoutSessionAttempt,
      items: {
        create: orderItems.map((item) => ({
          productId: item.productId,
          cartItemId: item.cartItemId,
          productName: item.productName || "Producto Test",
          quantity: item.quantity,
          price: item.price,
          subtotal:
            item.subtotal ??
            (Number(item.price) * item.quantity).toFixed(2),
        })),
      },
    },
    include: {
      items: true,
    },
  });
};

const authHeader = (user) => {
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  return `Bearer ${token}`;
};

const disconnectTestDatabase = () => prisma.$disconnect();

module.exports = {
  prisma,
  resetTestDatabase,
  createTestUser,
  createAdminUser,
  createProduct,
  createCartItem,
  createOrder,
  authHeader,
  uniqueEmail,
  disconnectTestDatabase,
};
