const {
  ORDER_STATUS,
  assertOrderTransition,
} = require("../../src/utils/order-status");

const expectTransition = (currentStatus, nextStatus, actor = "STRIPE") => {
  expect(() => assertOrderTransition(currentStatus, nextStatus, actor)).not.toThrow();
};

const expectRejectedTransition = (currentStatus, nextStatus, actor = "STRIPE") => {
  expect(() => assertOrderTransition(currentStatus, nextStatus, actor)).toThrow(
    "No se puede cambiar"
  );
};

describe("order status transitions", () => {
  it.each([
    [ORDER_STATUS.PENDING, ORDER_STATUS.PAID, "STRIPE"],
    [ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED, "STRIPE"],
    [ORDER_STATUS.PENDING, ORDER_STATUS.FAILED, "STRIPE"],
    [ORDER_STATUS.FAILED, ORDER_STATUS.REFUNDED, "STRIPE"],
    [ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING, "ADMIN"],
    [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, "ADMIN"],
    [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED, "ADMIN"],
  ])("permite %s -> %s por %s", (currentStatus, nextStatus, actor) => {
    expectTransition(currentStatus, nextStatus, actor);
  });

  it.each([
    [ORDER_STATUS.PAID, ORDER_STATUS.DELIVERED, "ADMIN"],
    [ORDER_STATUS.DELIVERED, ORDER_STATUS.PENDING, "STRIPE"],
    [ORDER_STATUS.REFUNDED, ORDER_STATUS.PROCESSING, "ADMIN"],
    [ORDER_STATUS.FAILED, ORDER_STATUS.PAID, "STRIPE"],
  ])("rechaza %s -> %s por %s", (currentStatus, nextStatus, actor) => {
    expectRejectedTransition(currentStatus, nextStatus, actor);
  });

  it("considera idempotente repetir el mismo estado", () => {
    expectTransition(ORDER_STATUS.PAID, ORDER_STATUS.PAID, "STRIPE");
    expectTransition(ORDER_STATUS.SHIPPED, ORDER_STATUS.SHIPPED, "ADMIN");
  });
});
