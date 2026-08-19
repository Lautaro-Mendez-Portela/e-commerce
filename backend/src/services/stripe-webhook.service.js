const { Prisma } = require("@prisma/client");
const stripe = require("../config/stripe");
const prisma = require("../config/prisma");
const AppError = require("../utils/app-error");
const {
  ORDER_STATUS,
  assertOrderTransition
} = require("../utils/order-status");

const REFUNDABLE_PAYMENT_STATUSES = ["paid", "succeeded"];

const getPaymentIntentId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id || null;
};

const parseOrderId = (value) => {
  const orderId = Number(value);

  if (!Number.isInteger(orderId) || orderId < 1) {
    return null;
  }

  return orderId;
};

const getOrderIdFromSession = (session) => {
  return parseOrderId(
    session.metadata?.orderId || session.client_reference_id
  );
};

const getOrderIdFromPaymentIntent = (paymentIntent) => {
  return parseOrderId(paymentIntent.metadata?.orderId);
};

const getProductQuantities = (items) => {
  return items.reduce((quantities, item) => {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) || 0) + item.quantity
    );

    return quantities;
  }, new Map());
};

const lockOrder = async (tx, orderId) => {
  await tx.$queryRaw`
    SELECT "id"
    FROM "Order"
    WHERE "id" = ${orderId}
    FOR UPDATE
  `;
};

const lockProducts = async (tx, productIds) => {
  if (productIds.length === 0) {
    return [];
  }

  return tx.$queryRaw`
    SELECT "id", "stock", "isActive"
    FROM "Product"
    WHERE "id" IN (${Prisma.join(productIds)})
    FOR UPDATE
  `;
};

const createStripeEvent = async (tx, event, orderId) => {
  return tx.stripeEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      orderId,
    },
  });
};

const validateAndReserveStock = async (tx, order) => {
  const productQuantities = getProductQuantities(order.items);
  const productIds = Array.from(productQuantities.keys());
  const lockedProducts = await lockProducts(tx, productIds);
  const productsById = new Map(
    lockedProducts.map((product) => [product.id, product])
  );

  for (const [productId, quantity] of productQuantities.entries()) {
    const product = productsById.get(productId);

    if (!product || !product.isActive || product.stock < quantity) {
      return false;
    }
  }

  for (const [productId, quantity] of productQuantities.entries()) {
    const updated = await tx.product.updateMany({
      where: {
        id: productId,
        isActive: true,
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (updated.count !== 1) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK_AT_PAYMENT",
        "Stock insuficiente al confirmar el pago"
      );
    }
  }

  return true;
};

const removePurchasedItemsFromCart = async (tx, order) => {
  for (const item of order.items) {
    if (!item.cartItemId) {
      continue;
    }

    const decremented = await tx.cartItem.updateMany({
      where: {
        id: item.cartItemId,
        userId: order.userId,
        productId: item.productId,
        quantity: {
          gt: item.quantity,
        },
      },
      data: {
        quantity: {
          decrement: item.quantity,
        },
      },
    });

    if (decremented.count === 0) {
      await tx.cartItem.deleteMany({
        where: {
          id: item.cartItemId,
          userId: order.userId,
          productId: item.productId,
          quantity: {
            lte: item.quantity,
          },
        },
      });
    }
  }
};

const getOrderForPayment = async (tx, orderId) => {
  if (!orderId) {
    return null;
  }

  await lockOrder(tx, orderId);

  return tx.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
    },
  });
};

const markOrderFailedForRefund = async (
  tx,
  {
    order,
    stripePaymentIntentId,
    stripePaymentStatus,
    stripeCheckoutSessionId,
  }
) => {
  assertOrderTransition(order.status, ORDER_STATUS.FAILED, "STRIPE");

  await tx.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: ORDER_STATUS.FAILED,
      stripePaymentIntentId:
        stripePaymentIntentId || order.stripePaymentIntentId,
      stripePaymentStatus,
      stripeCheckoutSessionId:
        stripeCheckoutSessionId || order.stripeCheckoutSessionId,
    },
  });
};

const attemptCompleteOrderPayment = async (
  event,
  {
    orderId,
    stripePaymentIntentId,
    stripePaymentStatus,
    stripeCheckoutSessionId,
  }
) => {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForPayment(tx, orderId);

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
    }

    if (order.status === ORDER_STATUS.PAID) {
      await createStripeEvent(tx, event, order.id);

      return {
        orderId: order.id,
        alreadyPaid: true,
        processed: true,
      };
    }

    if (order.status === ORDER_STATUS.REFUNDED || order.stripeRefundId) {
      await createStripeEvent(tx, event, order.id);

      return {
        orderId: order.id,
        alreadyRefunded: true,
        processed: true,
      };
    }

    if (
      order.status === ORDER_STATUS.FAILED &&
      stripePaymentIntentId &&
      !order.stripeRefundId
    ) {
      return {
        orderId: order.id,
        stripePaymentIntentId,
        stripePaymentStatus,
        refundRequired: true,
        processed: false,
      };
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      await createStripeEvent(tx, event, order.id);

      return {
        orderId: order.id,
        ignored: true,
        status: order.status,
        processed: true,
      };
    }

    if (
      stripePaymentStatus &&
      !REFUNDABLE_PAYMENT_STATUSES.includes(stripePaymentStatus)
    ) {
      await createStripeEvent(tx, event, order.id);

      return {
        orderId: order.id,
        ignored: true,
        stripePaymentStatus,
        processed: true,
      };
    }

    if (order.items.length === 0) {
      await markOrderFailedForRefund(tx, {
        order,
        stripePaymentIntentId,
        stripePaymentStatus: stripePaymentStatus || "paid",
        stripeCheckoutSessionId,
      });

      return {
        orderId: order.id,
        stripePaymentIntentId,
        stripePaymentStatus,
        refundRequired: Boolean(stripePaymentIntentId),
        refundUnavailable: !stripePaymentIntentId,
        processed: false,
      };
    }

    const hasStock = await validateAndReserveStock(tx, order);

    if (!hasStock) {
      await markOrderFailedForRefund(tx, {
        order,
        stripePaymentIntentId,
        stripePaymentStatus: stripePaymentStatus || "paid",
        stripeCheckoutSessionId,
      });

      return {
        orderId: order.id,
        stripePaymentIntentId,
        stripePaymentStatus,
        refundRequired: Boolean(stripePaymentIntentId),
        refundUnavailable: !stripePaymentIntentId,
        processed: false,
      };
    }

    assertOrderTransition(order.status, ORDER_STATUS.PAID, "STRIPE");

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: ORDER_STATUS.PAID,
        stripePaymentIntentId:
          stripePaymentIntentId || order.stripePaymentIntentId,
        stripeCheckoutSessionId:
          stripeCheckoutSessionId || order.stripeCheckoutSessionId,
        stripePaymentStatus: stripePaymentStatus || "paid",
        paidAt: new Date(),
      },
    });

    await removePurchasedItemsFromCart(tx, order);
    await createStripeEvent(tx, event, order.id);

    return {
      orderId: order.id,
      paid: true,
      processed: true,
    };
  });
};

const updatePendingOrderFromStripe = async (
  event,
  {
    orderId,
    nextStatus,
    stripePaymentIntentId,
    stripePaymentStatus,
    stripeCheckoutSessionId,
  }
) => {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForPayment(tx, orderId);

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      await createStripeEvent(tx, event, order.id);

      return {
        orderId: order.id,
        ignored: true,
        status: order.status,
        processed: true,
      };
    }

    assertOrderTransition(order.status, nextStatus, "STRIPE");

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: nextStatus,
        stripePaymentIntentId:
          stripePaymentIntentId || order.stripePaymentIntentId,
        stripePaymentStatus,
        stripeCheckoutSessionId:
          stripeCheckoutSessionId || order.stripeCheckoutSessionId,
        cancelledAt: nextStatus === ORDER_STATUS.CANCELLED
          ? new Date()
          : order.cancelledAt,
      },
    });

    await createStripeEvent(tx, event, order.id);

    return {
      orderId: order.id,
      status: nextStatus,
      processed: true,
    };
  });
};

const createRefund = async (orderId, stripePaymentIntentId) => {
  const idempotencyKey =
    `refund_order_${orderId}_payment_${stripePaymentIntentId}`;

  return stripe.refunds.create(
    {
      payment_intent: stripePaymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        orderId: String(orderId),
        reason: "insufficient_stock",
      },
    },
    {
      idempotencyKey,
    }
  );
};

const markOrderRefunded = async (
  event,
  {
    orderId,
    stripePaymentIntentId,
    stripePaymentStatus,
    refund,
  }
) => {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForPayment(tx, orderId);

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
    }

    if (order.status === ORDER_STATUS.REFUNDED || order.stripeRefundId) {
      await createStripeEvent(tx, event, order.id);

      return {
        orderId: order.id,
        alreadyRefunded: true,
        processed: true,
      };
    }

    assertOrderTransition(order.status, ORDER_STATUS.REFUNDED, "STRIPE");

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: ORDER_STATUS.REFUNDED,
        stripePaymentIntentId:
          stripePaymentIntentId || order.stripePaymentIntentId,
        stripePaymentStatus: stripePaymentStatus || "refunded",
        stripeRefundId: refund.id,
        stripeRefundStatus: refund.status,
        refundedAt: new Date(),
      },
    });

    await createStripeEvent(tx, event, order.id);

    return {
      orderId: order.id,
      refunded: true,
      stripeRefundId: refund.id,
      processed: true,
    };
  });
};

const processSuccessfulPaymentEvent = async (
  event,
  {
    orderId,
    stripePaymentIntentId,
    stripePaymentStatus,
    stripeCheckoutSessionId,
  }
) => {
  const result = await attemptCompleteOrderPayment(event, {
    orderId,
    stripePaymentIntentId,
    stripePaymentStatus,
    stripeCheckoutSessionId,
  });

  if (!result.refundRequired) {
    return result;
  }

  const refund = await createRefund(orderId, result.stripePaymentIntentId);

  return markOrderRefunded(event, {
    orderId,
    stripePaymentIntentId: result.stripePaymentIntentId,
    stripePaymentStatus,
    refund,
  });
};

const processStripeEvent = async (event) => {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;

    return processSuccessfulPaymentEvent(event, {
      orderId: getOrderIdFromSession(session),
      stripePaymentIntentId: getPaymentIntentId(session.payment_intent),
      stripePaymentStatus: session.payment_status || "paid",
      stripeCheckoutSessionId: session.id,
    });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    return processSuccessfulPaymentEvent(event, {
      orderId: getOrderIdFromPaymentIntent(paymentIntent),
      stripePaymentIntentId: paymentIntent.id,
      stripePaymentStatus: paymentIntent.status,
    });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;

    return updatePendingOrderFromStripe(event, {
      orderId: getOrderIdFromSession(session),
      nextStatus: ORDER_STATUS.CANCELLED,
      stripePaymentStatus: session.payment_status || "expired",
      stripeCheckoutSessionId: session.id,
    });
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;

    return updatePendingOrderFromStripe(event, {
      orderId: getOrderIdFromSession(session),
      nextStatus: ORDER_STATUS.FAILED,
      stripePaymentIntentId: getPaymentIntentId(session.payment_intent),
      stripePaymentStatus: session.payment_status || "failed",
      stripeCheckoutSessionId: session.id,
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    return updatePendingOrderFromStripe(event, {
      orderId: getOrderIdFromPaymentIntent(paymentIntent),
      nextStatus: ORDER_STATUS.FAILED,
      stripePaymentIntentId: paymentIntent.id,
      stripePaymentStatus: paymentIntent.status || "failed",
    });
  }

  return prisma.$transaction(async (tx) => {
    await createStripeEvent(tx, event, null);

    return {
      ignored: true,
      processed: true,
    };
  });
};

exports.handleStripeEvent = async (event) => {
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingEvent) {
    return {
      alreadyProcessed: true,
      processed: false,
    };
  }

  try {
    return await processStripeEvent(event);
  } catch (error) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("stripeEventId")
    ) {
      return {
        alreadyProcessed: true,
        processed: false,
      };
    }

    throw error;
  }
};
