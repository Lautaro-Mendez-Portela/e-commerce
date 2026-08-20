export const testProduct = {
  id: 1,
  name: "Auriculares Pro",
  description: "Auriculares de prueba para E2E",
  imageUrl: "",
  price: "99.99",
  stock: 5,
};

export const testOrder = {
  id: 1,
  status: "PAID",
  total: "99.99",
  createdAt: "2026-08-20T10:00:00.000Z",
  items: [
    {
      id: 1,
      productId: 1,
      productName: testProduct.name,
      quantity: 1,
      price: "99.99",
      subtotal: "99.99",
      product: testProduct,
    },
  ],
};

const json = (body, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

export const mockApi = async (page, {
  role = "USER",
  activeUser = true,
} = {}) => {
  let cartItems = [];
  let inventoryStock = 5;

  const handleApiRoute = async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === "/auth/login" && method === "POST") {
      await route.fulfill(json({
        accessToken: `${role.toLowerCase()}-access`,
        refreshToken: `${role.toLowerCase()}-refresh`,
      }));
      return;
    }

    if (path === "/users/me" && method === "GET") {
      if (!activeUser) {
        await route.fulfill(json({
          error: {
            code: "INVALID_TOKEN",
            message: "Token invalido",
          },
        }, 401));
        return;
      }

      await route.fulfill(json({
        id: role === "ADMIN" ? 10 : 20,
        firstName: role === "ADMIN" ? "Admin" : "Cliente",
        lastName: "E2E",
        email: role === "ADMIN" ? "admin@test.local" : "user@test.local",
        role,
      }));
      return;
    }

    if (path === "/products/admin" && method === "GET") {
      await route.fulfill(json({
        data: [
          {
            ...testProduct,
            stock: inventoryStock,
            isActive: true,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }));
      return;
    }

    if (path === "/products/1/stock" && method === "PATCH") {
      inventoryStock = request.postDataJSON().stock;
      await route.fulfill(json({
        ...testProduct,
        stock: inventoryStock,
        isActive: true,
      }));
      return;
    }

    if (path === "/products/1" && method === "GET") {
      await route.fulfill(json(testProduct));
      return;
    }

    if (path === "/products" && method === "GET") {
      await route.fulfill(json({
        data: [testProduct],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }));
      return;
    }

    if (path === "/cart" && method === "GET") {
      await route.fulfill(json(cartItems));
      return;
    }

    if (path === "/cart" && method === "POST") {
      cartItems = [
        {
          id: 1,
          productId: testProduct.id,
          quantity: request.postDataJSON().quantity || 1,
          product: testProduct,
        },
      ];
      await route.fulfill(json(cartItems[0]));
      return;
    }

    if (path === "/orders" && method === "POST") {
      await route.fulfill(json({
        id: 99,
        status: "PENDING",
        total: "99.99",
        items: testOrder.items,
      }, 201));
      return;
    }

    if (path === "/orders/my" && method === "GET") {
      await route.fulfill(json({
        data: [testOrder],
        pagination: {
          page: 1,
          limit: 6,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }));
      return;
    }

    if (path === "/orders/1" && method === "GET") {
      await route.fulfill(json(testOrder));
      return;
    }

    if (path === "/payments/checkout-session" && method === "POST") {
      await route.fulfill(json({
        url: "https://checkout.stripe.test/session",
      }));
      return;
    }

    if (path === "/dashboard/admin" && method === "GET") {
      await route.fulfill(json({
        totalSales: "99.99",
        salesLast7Days: "99.99",
        orderCount: 1,
        ordersLast7Days: 1,
        registeredUsers: 1,
        productCount: 1,
        lowStockThreshold: 5,
        lowStockProducts: [],
        statusCounts: {
          PAID: 1,
        },
        dailySales: [
          {
            date: "2026-08-20",
            total: "99.99",
            orderCount: 1,
          },
        ],
        lastPurchase: testOrder,
        topSellingProduct: {
          ...testProduct,
          quantitySold: 1,
        },
      }));
      return;
    }

    await route.fulfill(json({
      error: {
        code: "NOT_MOCKED",
        message: `${method} ${path} no mockeado`,
      },
    }, 500));
  };

  await page.route("http://127.0.0.1:3000/**", handleApiRoute);
  await page.route("http://localhost:3000/**", handleApiRoute);
};

export const login = async (page, email = "user@test.local") => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contrasena").fill("Password123!");
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
};
