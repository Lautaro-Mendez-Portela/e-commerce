const AppError = require("./app-error");

const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
};

const ADMIN_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.PROCESSING],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.FAILED]: [],
};

const STRIPE_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [
    ORDER_STATUS.PAID,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.FAILED,
  ],
  [ORDER_STATUS.PAID]: [],
  [ORDER_STATUS.PROCESSING]: [],
  [ORDER_STATUS.SHIPPED]: [],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.FAILED]: [],
};

const getAllowedTransitions = (actor) => {
  if (actor === "ADMIN") {
    return ADMIN_TRANSITIONS;
  }

  if (actor === "STRIPE") {
    return STRIPE_TRANSITIONS;
  }

  return {};
};

const assertOrderTransition = (currentStatus, nextStatus, actor) => {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions = getAllowedTransitions(actor);
  const allowedNextStatuses = allowedTransitions[currentStatus] || [];

  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new AppError(
      409,
      "INVALID_ORDER_STATUS_TRANSITION",
      `No se puede cambiar una orden de ${currentStatus} a ${nextStatus}`
    );
  }
};

exports.ORDER_STATUS = ORDER_STATUS;
exports.assertOrderTransition = assertOrderTransition;
