const {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} = require("../../src/validators/auth.validator");
const {
  cartItemSchema,
  cartQuantitySchema,
} = require("../../src/validators/cart.validator");
const {
  adminProductQuerySchema,
  createProductSchema,
  productParamsSchema,
  productQuerySchema,
  updateProductStockSchema,
} = require("../../src/validators/product.validator");
const {
  orderParamsSchema,
  updateOrderStatusSchema,
} = require("../../src/validators/order.validator");
const {
  paymentOrderSchema,
} = require("../../src/validators/payment.validator");

describe("validators criticos", () => {
  describe("auth", () => {
    it("rechaza email invalido", () => {
      const result = registerSchema.safeParse({
        firstName: "Test",
        lastName: "User",
        email: "no-es-email",
        password: "Password123!",
      });

      expect(result.success).toBe(false);
    });

    it("rechaza password corta en registro", () => {
      const result = registerSchema.safeParse({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "123",
      });

      expect(result.success).toBe(false);
    });

    it("normaliza login valido", () => {
      const result = loginSchema.safeParse({
        email: "USER@Example.COM ",
        password: "secret",
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe("user@example.com");
    });

    it("requiere refresh token no vacio", () => {
      expect(refreshTokenSchema.safeParse({ refreshToken: "" }).success).toBe(false);
      expect(refreshTokenSchema.safeParse({ refreshToken: "token" }).success).toBe(true);
    });
  });

  describe("cart", () => {
    it.each([
      ["cero", 0],
      ["negativa", -1],
      ["decimal", 1.5],
      ["string invalido", "2"],
      ["NaN", Number.NaN],
    ])("rechaza quantity %s", (label, quantity) => {
      expect(cartItemSchema.safeParse({
        productId: 1,
        quantity,
      }).success).toBe(false);
    });

    it("acepta quantity entera positiva", () => {
      expect(cartItemSchema.safeParse({
        productId: 1,
        quantity: 2,
      }).success).toBe(true);
    });

    it("rechaza update de quantity no positiva", () => {
      expect(cartQuantitySchema.safeParse({ quantity: 0 }).success).toBe(false);
    });
  });

  describe("products", () => {
    it("rechaza precio invalido", () => {
      expect(createProductSchema.safeParse({
        name: "Producto",
        description: "Descripcion valida",
        price: 0,
        stock: 1,
      }).success).toBe(false);
    });

    it("rechaza stock negativo", () => {
      expect(createProductSchema.safeParse({
        name: "Producto",
        description: "Descripcion valida",
        price: 10,
        stock: -1,
      }).success).toBe(false);
    });

    it("rechaza filtros invalidos", () => {
      expect(productQuerySchema.safeParse({ sort: "random" }).success).toBe(false);
      expect(adminProductQuerySchema.safeParse({ stockFilter: "NEGATIVE" }).success).toBe(false);
    });

    it("valida ids y stock admin", () => {
      expect(productParamsSchema.safeParse({ id: "abc" }).success).toBe(false);
      expect(updateProductStockSchema.safeParse({ stock: -1 }).success).toBe(false);
      expect(updateProductStockSchema.safeParse({ stock: 0 }).success).toBe(true);
    });
  });

  describe("orders y payments", () => {
    it("rechaza ids invalidos", () => {
      expect(orderParamsSchema.safeParse({ id: "0" }).success).toBe(false);
      expect(paymentOrderSchema.safeParse({ orderId: -1 }).success).toBe(false);
    });

    it("rechaza estados invalidos", () => {
      expect(updateOrderStatusSchema.safeParse({ status: "DONE" }).success).toBe(false);
    });

    it("acepta payment orderId valido", () => {
      expect(paymentOrderSchema.safeParse({ orderId: 10 }).success).toBe(true);
    });
  });
});
