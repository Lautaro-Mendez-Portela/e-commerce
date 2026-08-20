const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
const USER_EMAIL = process.env.SEED_USER_EMAIL || "user@example.com";
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || "User123!";

const products = [
  {
    name: "Auriculares Pro",
    description: "Auriculares inalambricos con cancelacion de ruido para uso diario.",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    price: "99.99",
    stock: 12,
  },
  {
    name: "Teclado Mecanico",
    description: "Teclado compacto con switches tactiles y construccion robusta.",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
    price: "79.50",
    stock: 5,
  },
  {
    name: "Mouse Precision",
    description: "Mouse ergonomico con sensor de alta precision.",
    imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db",
    price: "45.00",
    stock: 2,
  },
  {
    name: "Monitor 27",
    description: "Monitor de 27 pulgadas para productividad y entretenimiento.",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf",
    price: "249.99",
    stock: 0,
  },
];

const upsertUser = async ({
  email,
  password,
  firstName,
  lastName,
  role,
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: {
      email,
    },
    update: {
      firstName,
      lastName,
      role,
      isActive: true,
    },
    create: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: true,
    },
  });
};

const upsertProductByName = async (data) => {
  const existingProduct = await prisma.product.findFirst({
    where: {
      name: data.name,
    },
  });

  if (existingProduct) {
    return prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  return prisma.product.create({
    data: {
      ...data,
      isActive: true,
    },
  });
};

const main = async () => {
  await upsertUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    firstName: "Admin",
    lastName: "Demo",
    role: "ADMIN",
  });

  await upsertUser({
    email: USER_EMAIL,
    password: USER_PASSWORD,
    firstName: "Usuario",
    lastName: "Demo",
    role: "USER",
  });

  for (const product of products) {
    await upsertProductByName(product);
  }

  console.log("Seed de desarrollo aplicado");
  console.log(`ADMIN: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`USER: ${USER_EMAIL} / ${USER_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
