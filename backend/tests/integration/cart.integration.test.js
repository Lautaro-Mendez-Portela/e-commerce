const {
  authHeader,
  createProduct,
  createTestUser,
  disconnectTestDatabase,
  resetTestDatabase,
} = require("../helpers/test-db");
const request = require("../helpers/http");

describe("cart integration", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("agrega producto con quantity valida e incrementa item existente", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 5 });
    const authorization = authHeader(user);

    await request
      .post("/cart")
      .set("Authorization", authorization)
      .send({ productId: product.id, quantity: 2 })
      .expect(200);

    const response = await request
      .post("/cart")
      .set("Authorization", authorization)
      .send({ productId: product.id, quantity: 1 })
      .expect(200);

    expect(response.body.quantity).toBe(3);
  });

  it.each([
    ["negativa", -1],
    ["cero", 0],
    ["decimal", 1.5],
    ["string invalido", "2"],
  ])("rechaza quantity %s", async (label, quantity) => {
    const user = await createTestUser();
    const product = await createProduct();

    const response = await request
      .post("/cart")
      .set("Authorization", authHeader(user))
      .send({ productId: product.id, quantity })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza quantity mayor al stock", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 1 });

    const response = await request
      .post("/cart")
      .set("Authorization", authHeader(user))
      .send({ productId: product.id, quantity: 2 })
      .expect(409);

    expect(response.body.error.code).toBe("INSUFFICIENT_STOCK");
  });

  it("actualiza, decrementa y elimina items del usuario", async () => {
    const user = await createTestUser();
    const product = await createProduct({ stock: 5 });
    const authorization = authHeader(user);

    const created = await request
      .post("/cart")
      .set("Authorization", authorization)
      .send({ productId: product.id, quantity: 3 })
      .expect(200);

    const updated = await request
      .put(`/cart/${created.body.id}`)
      .set("Authorization", authorization)
      .send({ quantity: 1 })
      .expect(200);

    expect(updated.body.quantity).toBe(1);

    await request
      .delete(`/cart/${created.body.id}`)
      .set("Authorization", authorization)
      .expect(200);

    const cart = await request
      .get("/cart")
      .set("Authorization", authorization)
      .expect(200);

    expect(cart.body).toHaveLength(0);
  });

  it("impide modificar carrito de otro usuario", async () => {
    const owner = await createTestUser();
    const attacker = await createTestUser();
    const product = await createProduct({ stock: 5 });

    const created = await request
      .post("/cart")
      .set("Authorization", authHeader(owner))
      .send({ productId: product.id, quantity: 1 })
      .expect(200);

    await request
      .put(`/cart/${created.body.id}`)
      .set("Authorization", authHeader(attacker))
      .send({ quantity: 2 })
      .expect(404);

    await request
      .delete(`/cart/${created.body.id}`)
      .set("Authorization", authHeader(attacker))
      .expect(404);
  });
});
