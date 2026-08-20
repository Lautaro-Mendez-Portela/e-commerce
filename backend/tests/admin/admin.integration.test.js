const {
  authHeader,
  createAdminUser,
  createOrder,
  createProduct,
  createTestUser,
  disconnectTestDatabase,
  resetTestDatabase,
} = require("../helpers/test-db");
const request = require("../helpers/http");

describe("admin integration", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("bloquea USER y permite ADMIN en dashboard", async () => {
    const user = await createTestUser();
    const admin = await createAdminUser();

    await request
      .get("/dashboard/admin")
      .set("Authorization", authHeader(user))
      .expect(403);

    const response = await request
      .get("/dashboard/admin")
      .set("Authorization", authHeader(admin))
      .expect(200);

    expect(response.body).toHaveProperty("totalSales");
  });

  it("ADMIN crea, edita y no puede guardar stock negativo", async () => {
    const admin = await createAdminUser();
    const authorization = authHeader(admin);

    const created = await request
      .post("/products")
      .set("Authorization", authorization)
      .send({
        name: "Producto Admin",
        description: "Producto creado por admin",
        imageUrl: "https://example.com/admin.png",
        price: 50,
        stock: 5,
      })
      .expect(201);

    await request
      .put(`/products/${created.body.id}`)
      .set("Authorization", authorization)
      .send({
        name: "Producto Admin Editado",
        price: 60,
      })
      .expect(200);

    await request
      .patch(`/products/${created.body.id}/stock`)
      .set("Authorization", authorization)
      .send({ stock: -1 })
      .expect(400);
  });

  it("aplica transiciones admin validas e invalida PAID -> DELIVERED", async () => {
    const admin = await createAdminUser();
    const user = await createTestUser();
    const product = await createProduct();
    const paidOrder = await createOrder({
      userId: user.id,
      status: "PAID",
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: "25.50",
        },
      ],
    });
    const authorization = authHeader(admin);

    await request
      .patch(`/orders/${paidOrder.id}/status`)
      .set("Authorization", authorization)
      .send({ status: "DELIVERED" })
      .expect(409);

    const processing = await request
      .patch(`/orders/${paidOrder.id}/status`)
      .set("Authorization", authorization)
      .send({ status: "PROCESSING" })
      .expect(200);

    expect(processing.body.status).toBe("PROCESSING");

    const shipped = await request
      .patch(`/orders/${paidOrder.id}/status`)
      .set("Authorization", authorization)
      .send({ status: "SHIPPED" })
      .expect(200);

    expect(shipped.body.status).toBe("SHIPPED");

    const delivered = await request
      .patch(`/orders/${paidOrder.id}/status`)
      .set("Authorization", authorization)
      .send({ status: "DELIVERED" })
      .expect(200);

    expect(delivered.body.status).toBe("DELIVERED");
  });

  it("bloquea administracion de usuarios a USER y permite ADMIN", async () => {
    const user = await createTestUser();
    const admin = await createAdminUser();
    const target = await createTestUser();

    await request
      .patch(`/users/${target.id}/role`)
      .set("Authorization", authHeader(user))
      .send({ role: "ADMIN" })
      .expect(403);

    const response = await request
      .patch(`/users/${target.id}/role`)
      .set("Authorization", authHeader(admin))
      .send({ role: "ADMIN" })
      .expect(200);

    expect(response.body.role).toBe("ADMIN");
  });

  it("usuario desactivado pierde acceso", async () => {
    const admin = await createAdminUser();
    const target = await createTestUser();
    const targetToken = authHeader(target);

    await request
      .patch(`/users/${target.id}/status`)
      .set("Authorization", authHeader(admin))
      .send({ isActive: false })
      .expect(200);

    await request
      .get("/users/me")
      .set("Authorization", targetToken)
      .expect(401);
  });
});
