const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
  authHeader,
  createAdminUser,
  createTestUser,
  disconnectTestDatabase,
  prisma,
  resetTestDatabase,
  uniqueEmail,
} = require("../helpers/test-db");
const request = require("../helpers/http");

describe("auth integration", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe("REGISTER", () => {
    it("crea usuario valido y hashea password", async () => {
      const email = uniqueEmail("register");

      const response = await request
        .post("/auth/register")
        .send({
          firstName: "Lauta",
          lastName: "Tester",
          email,
          password: "Password123!",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        email,
        firstName: "Lauta",
        lastName: "Tester",
      });
      expect(response.body.password).toBeUndefined();

      const user = await prisma.user.findUnique({ where: { email } });

      expect(user).toBeTruthy();
      expect(user.password).not.toBe("Password123!");
      await expect(bcrypt.compare("Password123!", user.password)).resolves.toBe(true);
    });

    it("falla con email duplicado", async () => {
      const email = uniqueEmail("duplicate");

      await createTestUser({ email });

      const response = await request
        .post("/auth/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email,
          password: "Password123!",
        })
        .expect(409);

      expect(response.body.error.code).toBe("USER_ALREADY_EXISTS");
    });
  });

  describe("LOGIN", () => {
    it("devuelve tokens con credenciales correctas", async () => {
      const user = await createTestUser();

      const response = await request
        .post("/auth/login")
        .send({
          email: user.email,
          password: user.plainPassword,
        })
        .expect(200);

      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
    });

    it("rechaza password incorrecta", async () => {
      const user = await createTestUser();

      const response = await request
        .post("/auth/login")
        .send({
          email: user.email,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("rechaza usuario inexistente", async () => {
      const response = await request
        .post("/auth/login")
        .send({
          email: uniqueEmail("missing"),
          password: "Password123!",
        })
        .expect(401);

      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("rechaza usuario desactivado", async () => {
      const user = await createTestUser({ isActive: false });

      const response = await request
        .post("/auth/login")
        .send({
          email: user.email,
          password: user.plainPassword,
        })
        .expect(403);

      expect(response.body.error.code).toBe("ACCOUNT_DISABLED");
    });
  });

  describe("AUTH y roles", () => {
    it("sin token devuelve 401", async () => {
      const response = await request.get("/users/me").expect(401);

      expect(response.body.error.code).toBe("TOKEN_REQUIRED");
    });

    it("token invalido devuelve 401", async () => {
      const response = await request
        .get("/users/me")
        .set("Authorization", "Bearer token-invalido")
        .expect(401);

      expect(response.body.error.code).toBe("INVALID_TOKEN");
    });

    it("USER en ruta ADMIN devuelve 403", async () => {
      const user = await createTestUser();

      const response = await request
        .get("/users/admin")
        .set("Authorization", authHeader(user))
        .expect(403);

      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("ADMIN accede a ruta ADMIN", async () => {
      const admin = await createAdminUser();

      const response = await request
        .get("/users/admin")
        .set("Authorization", authHeader(admin))
        .expect(200);

      expect(response.body.message).toBe("Bienvenido admin");
    });
  });

  describe("REFRESH", () => {
    it("emite access token con refresh valido", async () => {
      const user = await createTestUser();
      const login = await request
        .post("/auth/login")
        .send({
          email: user.email,
          password: user.plainPassword,
        })
        .expect(200);

      const response = await request
        .post("/auth/refresh")
        .send({ refreshToken: login.body.refreshToken })
        .expect(200);

      expect(response.body.accessToken).toEqual(expect.any(String));
    });

    it("rechaza refresh invalido", async () => {
      const response = await request
        .post("/auth/refresh")
        .send({ refreshToken: "refresh-invalido" })
        .expect(401);

      expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("rechaza refresh expirado aunque exista guardado", async () => {
      const user = await createTestUser();
      const expiredToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "-1s" }
      );

      await prisma.refreshToken.create({
        data: {
          token: expiredToken,
          userId: user.id,
        },
      });

      const response = await request
        .post("/auth/refresh")
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.error.code).toBe("REFRESH_TOKEN_EXPIRED");
    });
  });
});
