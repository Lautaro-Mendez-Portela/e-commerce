const prisma = require("../config/prisma");

exports.createOrder = async (userId) => {
  return await prisma.$transaction(async (tx) => {
    const cartItems = await tx.cartItem.findMany({
      where: {
        userId,
      },

      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      throw new Error("Carrito vacío");
    }

    let total = 0;

    const orderItemsData = [];

    for (const item of cartItems) {
      const product = item.product;

      if (!product) {
        throw new Error("Producto no encontrado");
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }

      total += product.price * item.quantity;

      orderItemsData.push({
        productId: product.id,

        quantity: item.quantity,

        price: product.price,
      });
    }

    const order = await tx.order.create({
      data: {
        userId,

        total,

        items: {
          create: orderItemsData,
        },
      },

      include: {
        items: true,
      },
    });

    for (const item of cartItems) {
      await tx.product.update({
        where: {
          id: item.productId,
        },

        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        userId,
      },
    });

    return order;
  });
};
