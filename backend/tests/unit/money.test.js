const {
  addMoney,
  multiplyMoney,
  toDecimal,
  toStripeAmount,
} = require("../../src/utils/money");

describe("money utils", () => {
  it("convierte valores a Decimal sin depender de float", () => {
    const result = toDecimal("0.10").plus(toDecimal("0.20"));

    expect(result.toString()).toBe("0.3");
  });

  it("suma importes con Decimal", () => {
    expect(addMoney("10.10", "0.20").toString()).toBe("10.3");
  });

  it("calcula subtotales por cantidad", () => {
    expect(multiplyMoney("19.995", 2).toString()).toBe("39.99");
  });

  it("convierte a centavos Stripe", () => {
    expect(toStripeAmount("25.50")).toBe(2550);
    expect(toStripeAmount("10.005")).toBe(1001);
  });
});
