const prisma = require("../config/prisma");

exports.createOrder = async (
  userId,
  items
) => {

  return await prisma.$transaction(async (tx) => {

    let total = 0;

    const orderItemsData = [];

    for (const item of items) {

      const product = await tx.product.findUnique({
        where: {
          id: item.productId
        }
      });

      if (!product) {
        throw new Error("Producto no encontrado");
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${product.name}`
        );
      }

      total += product.price * item.quantity;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const order = await tx.order.create({
      data: {
        userId,
        total,

        items: {
          create: orderItemsData
        }
      },

      include: {
        items: true
      }
    });

    for (const item of items) {

      await tx.product.update({
        where: {
          id: item.productId
        },

        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    return order;

  });
};