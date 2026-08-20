const {
  authHeader,
  createCartItem,
  createProduct,
  createTestUser,
  disconnectTestDatabase,
  prisma,
  resetTestDatabase,
} = require("../helpers/test-db");
const request = require("../helpers/http");

describe("order creation integration", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("crea Order PENDING con snapshot, total correcto, stock intacto y carrito intacto", async () => {
    const user = await createTestUser();
    const product = await createProduct({
      name: "Notebook",
      price: "100.50",
      stock: 4,
    });

    await createCartItem({
      userId: user.id,
      productId: product.id,
      quantity: 2,
    });

    const response = await request
      .post("/orders")
      .set("Authorization", authHeader(user))
      .expect(201);

    expect(response.body.status).toBe("PENDING");
    expect(Number(response.body.total)).toBe(201);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      productId: product.id,
      productName: "Notebook",
      quantity: 2,
    });

    const productAfter = await prisma.product.findUnique({
      where: { id: product.id },
    });
    const cartAfter = await prisma.cartItem.findMany({
      where: { userId: user.id },
    });

    expect(productAfter.stock).toBe(4);
    expect(cartAfter).toHaveLength(1);
    expect(cartAfter[0].quantity).toBe(2);
  });

  it("rechaza carrito vacio", async () => {
    const user = await createTestUser();

    const response = await request
      .post("/orders")
      .set("Authorization", authHeader(user))
      .expect(400);

    expect(response.body.error.code).toBe("EMPTY_CART");
  });

  it("rechaza stock insuficiente", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 1 });

    await createCartItem({
      userId: user.id,
      productId: product.id,
      quantity: 2,
    });

    const response = await request
      .post("/orders")
      .set("Authorization", authHeader(user))
      .expect(409);

    expect(response.body.error.code).toBe("INSUFFICIENT_STOCK");
  });

  it("rechaza producto desactivado", async () => {
    const user = await createTestUser();
    const product = await createProduct({ isActive: false });

    await createCartItem({
      userId: user.id,
      productId: product.id,
      quantity: 1,
    });

    const response = await request
      .post("/orders")
      .set("Authorization", authHeader(user))
      .expect(404);

    expect(response.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("rechaza cantidades invalidas persistidas en carrito", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 5 });

    await createCartItem({
      userId: user.id,
      productId: product.id,
      quantity: 1,
    });

    await prisma.cartItem.updateMany({
      where: {
        userId: user.id,
        productId: product.id,
      },
      data: {
        quantity: 0,
      },
    });

    const response = await request
      .post("/orders")
      .set("Authorization", authHeader(user))
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_CART_QUANTITY");
  });
});
