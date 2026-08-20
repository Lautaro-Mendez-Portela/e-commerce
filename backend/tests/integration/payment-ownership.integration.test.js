const {
  authHeader,
  createOrder,
  createProduct,
  createTestUser,
  disconnectTestDatabase,
  resetTestDatabase,
} = require("../helpers/test-db");
const request = require("../helpers/http");

describe("payment ownership and IDOR", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("otro usuario no puede consultar ni iniciar checkout de una orden ajena", async () => {
    const owner = await createTestUser();
    const attacker = await createTestUser();
    const product = await createProduct();
    const order = await createOrder({
      userId: owner.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "25.50",
        },
      ],
    });

    await request
      .get(`/orders/${order.id}`)
      .set("Authorization", authHeader(attacker))
      .expect(404);

    const checkoutResponse = await request
      .post("/payments/checkout-session")
      .set("Authorization", authHeader(attacker))
      .send({ orderId: order.id })
      .expect(404);

    expect(checkoutResponse.body.error.code).toBe("ORDER_NOT_FOUND");
  });

  it("ADMIN no obtiene privilegios accidentales en endpoints de cliente", async () => {
    const owner = await createTestUser();
    const admin = await createTestUser({ role: "ADMIN" });
    const product = await createProduct();
    const order = await createOrder({
      userId: owner.id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "25.50",
        },
      ],
    });

    await request
      .get(`/orders/${order.id}`)
      .set("Authorization", authHeader(admin))
      .expect(404);

    await request
      .post("/payments/checkout-session")
      .set("Authorization", authHeader(admin))
      .send({ orderId: order.id })
      .expect(404);
  });
});
