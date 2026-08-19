const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const AppError = require("../utils/app-error");
const {
  ORDER_STATUS,
  assertOrderTransition
} = require("../utils/order-status");

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

const markOrderFailedForStock = async (
  tx,
  order,
  paymentIntentId,
  stripePaymentStatus,
  stripeCheckoutSessionId
) => {
  assertOrderTransition(order.status, ORDER_STATUS.FAILED, "STRIPE");

  await tx.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: ORDER_STATUS.FAILED,
      paymentIntentId: paymentIntentId || order.paymentIntentId,
      stripePaymentStatus,
      stripeCheckoutSessionId:
        stripeCheckoutSessionId || order.stripeCheckoutSessionId,
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

const completeOrderPayment = async (
  tx,
  {
    orderId,
    paymentIntentId,
    stripePaymentStatus,
    stripeCheckoutSessionId,
  }
) => {
  if (!orderId) {
    return {
      orderId: null,
      ignored: true,
    };
  }

  const order = await tx.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
  }

  if (order.status === ORDER_STATUS.PAID) {
    return {
      orderId: order.id,
      alreadyPaid: true,
    };
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    return {
      orderId: order.id,
      ignored: true,
      status: order.status,
    };
  }

  if (stripePaymentStatus && !["paid", "succeeded"].includes(stripePaymentStatus)) {
    return {
      orderId: order.id,
      ignored: true,
      stripePaymentStatus,
    };
  }

  if (order.items.length === 0) {
    await markOrderFailedForStock(
      tx,
      order,
      paymentIntentId,
      stripePaymentStatus || "failed",
      stripeCheckoutSessionId
    );

    return {
      orderId: order.id,
      failed: true,
    };
  }

  const hasStock = await validateAndReserveStock(tx, order);

  if (!hasStock) {
    await markOrderFailedForStock(
      tx,
      order,
      paymentIntentId,
      stripePaymentStatus || "failed",
      stripeCheckoutSessionId
    );

    return {
      orderId: order.id,
      failed: true,
    };
  }

  assertOrderTransition(order.status, ORDER_STATUS.PAID, "STRIPE");

  await tx.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: ORDER_STATUS.PAID,
      paymentIntentId: paymentIntentId || order.paymentIntentId,
      stripeCheckoutSessionId:
        stripeCheckoutSessionId || order.stripeCheckoutSessionId,
      stripePaymentStatus: stripePaymentStatus || "paid",
      paidAt: new Date(),
    },
  });

  await removePurchasedItemsFromCart(tx, order);

  return {
    orderId: order.id,
    paid: true,
  };
};

const updatePendingOrderFromStripe = async (
  tx,
  {
    orderId,
    nextStatus,
    paymentIntentId,
    stripePaymentStatus,
    stripeCheckoutSessionId,
  }
) => {
  if (!orderId) {
    return {
      orderId: null,
      ignored: true,
    };
  }

  const order = await tx.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    return {
      orderId: order.id,
      ignored: true,
      status: order.status,
    };
  }

  assertOrderTransition(order.status, nextStatus, "STRIPE");

  await tx.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: nextStatus,
      paymentIntentId: paymentIntentId || order.paymentIntentId,
      stripePaymentStatus,
      stripeCheckoutSessionId:
        stripeCheckoutSessionId || order.stripeCheckoutSessionId,
      cancelledAt: nextStatus === ORDER_STATUS.CANCELLED
        ? new Date()
        : order.cancelledAt,
    },
  });

  return {
    orderId: order.id,
    status: nextStatus,
  };
};

const processStripeEvent = async (tx, event) => {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;

    return completeOrderPayment(tx, {
      orderId: getOrderIdFromSession(session),
      paymentIntentId: getPaymentIntentId(session.payment_intent),
      stripePaymentStatus: session.payment_status || "paid",
      stripeCheckoutSessionId: session.id,
    });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    return completeOrderPayment(tx, {
      orderId: getOrderIdFromPaymentIntent(paymentIntent),
      paymentIntentId: paymentIntent.id,
      stripePaymentStatus: paymentIntent.status,
    });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;

    return updatePendingOrderFromStripe(tx, {
      orderId: getOrderIdFromSession(session),
      nextStatus: ORDER_STATUS.CANCELLED,
      stripePaymentStatus: session.payment_status || "expired",
      stripeCheckoutSessionId: session.id,
    });
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;

    return updatePendingOrderFromStripe(tx, {
      orderId: getOrderIdFromSession(session),
      nextStatus: ORDER_STATUS.FAILED,
      paymentIntentId: getPaymentIntentId(session.payment_intent),
      stripePaymentStatus: session.payment_status || "failed",
      stripeCheckoutSessionId: session.id,
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    return updatePendingOrderFromStripe(tx, {
      orderId: getOrderIdFromPaymentIntent(paymentIntent),
      nextStatus: ORDER_STATUS.FAILED,
      paymentIntentId: paymentIntent.id,
      stripePaymentStatus: paymentIntent.status || "failed",
    });
  }

  return {
    ignored: true,
  };
};

exports.handleStripeEvent = async (event) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const stripeEvent = await tx.stripeEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
        },
      });

      const result = await processStripeEvent(tx, event);

      if (result.orderId) {
        await tx.stripeEvent.update({
          where: {
            id: stripeEvent.id,
          },
          data: {
            orderId: result.orderId,
          },
        });
      }

      return {
        ...result,
        processed: true,
      };
    });
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
