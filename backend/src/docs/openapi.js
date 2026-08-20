const env = require("../config/env");

const apiServerUrl = env.apiUrl || `http://localhost:${env.port}`;

const decimal = {
  type: "string",
  format: "decimal",
  example: "99.99",
  description: "Prisma Decimal se serializa como string en JSON.",
};

const idParam = (name = "id") => ({
  name,
  in: "path",
  required: true,
  schema: {
    type: "integer",
    minimum: 1,
  },
});

const pageParam = {
  name: "page",
  in: "query",
  schema: {
    type: "integer",
    minimum: 1,
    default: 1,
  },
};

const limitParam = {
  name: "limit",
  in: "query",
  schema: {
    type: "integer",
    minimum: 1,
    maximum: 100,
    default: 10,
  },
};

const bearerSecurity = [{ bearerAuth: [] }];

const jsonBody = (schema) => ({
  required: true,
  content: {
    "application/json": {
      schema,
    },
  },
});

const response = (description, schema, status = "application/json") => ({
  description,
  content: schema
    ? {
        [status]: {
          schema,
        },
      }
    : undefined,
});

const errorResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ApiError",
      },
    },
  },
});

const paginated = (itemRef) => ({
  type: "object",
  required: ["data", "pagination"],
  properties: {
    data: {
      type: "array",
      items: {
        $ref: itemRef,
      },
    },
    pagination: {
      $ref: "#/components/schemas/Pagination",
    },
  },
});

const orderStatuses = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "REFUNDED",
];

const commonErrorResponses = {
  400: {
    $ref: "#/components/responses/BadRequest",
  },
  401: {
    $ref: "#/components/responses/Unauthorized",
  },
  403: {
    $ref: "#/components/responses/Forbidden",
  },
  404: {
    $ref: "#/components/responses/NotFound",
  },
  409: {
    $ref: "#/components/responses/Conflict",
  },
  500: {
    $ref: "#/components/responses/InternalError",
  },
};

module.exports = {
  openapi: "3.1.0",
  info: {
    title: "E-Commerce API",
    version: "2.0.0",
    description: [
      "API REST para e-commerce con autenticacion JWT, productos, carrito, favoritos, ordenes, pagos Stripe Checkout y panel admin.",
      "",
      "El pago no se confirma desde el frontend: la confirmacion final ocurre por eventos de Stripe webhook.",
      "El webhook Stripe real es `POST /payments/webhook`, consume raw body y requiere header `Stripe-Signature`; se documenta aqui textualmente y no se expone como operacion interactiva porque no esta pensado para uso manual desde Swagger UI.",
    ].join("\n"),
  },
  servers: [
    {
      url: apiServerUrl,
      description: "Entorno local/configurado por API_URL",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "Estado basico del backend y conectividad DB.",
    },
    {
      name: "Auth",
      description: "Registro, login y renovacion de access token.",
    },
    {
      name: "Products",
      description: "Catalogo publico y gestion admin de productos.",
    },
    {
      name: "Cart",
      description: "Carrito del usuario autenticado.",
    },
    {
      name: "Favorites",
      description: "Favoritos del usuario autenticado.",
    },
    {
      name: "Orders",
      description: [
        "Ordenes de usuario y administracion.",
        "Transiciones admin permitidas: PENDING -> CANCELLED, PAID -> PROCESSING, PROCESSING -> SHIPPED, SHIPPED -> DELIVERED.",
      ].join(" "),
    },
    {
      name: "Payments",
      description: "Inicio de PaymentIntent o Stripe Checkout para ordenes propias PENDING.",
    },
    {
      name: "Users",
      description: "Perfil propio y administracion de usuarios.",
    },
    {
      name: "Admin",
      description: "Endpoints que requieren role = ADMIN.",
    },
    {
      name: "Stripe Webhook",
      description: "POST /payments/webhook usa raw body y Stripe-Signature; no se expone como Try it out.",
    },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Healthcheck del backend",
        responses: {
          200: response("Servicio disponible", {
            type: "object",
            properties: {
              status: {
                type: "string",
                example: "ok",
              },
            },
          }),
          503: errorResponse("Servicio no disponible"),
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar usuario",
        requestBody: jsonBody({
          $ref: "#/components/schemas/RegisterRequest",
        }),
        responses: {
          201: response("Usuario registrado", {
            $ref: "#/components/schemas/AuthUser",
          }),
          400: commonErrorResponses[400],
          409: commonErrorResponses[409],
          500: commonErrorResponses[500],
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesion",
        requestBody: jsonBody({
          $ref: "#/components/schemas/LoginRequest",
        }),
        responses: {
          200: response("Tokens JWT emitidos", {
            $ref: "#/components/schemas/LoginResponse",
          }),
          400: commonErrorResponses[400],
          401: commonErrorResponses[401],
          403: commonErrorResponses[403],
          500: commonErrorResponses[500],
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Renovar access token",
        requestBody: jsonBody({
          $ref: "#/components/schemas/RefreshTokenRequest",
        }),
        responses: {
          200: response("Access token renovado", {
            $ref: "#/components/schemas/RefreshTokenResponse",
          }),
          400: commonErrorResponses[400],
          401: commonErrorResponses[401],
          403: commonErrorResponses[403],
          500: commonErrorResponses[500],
        },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "Listar productos activos",
        parameters: [
          pageParam,
          limitParam,
          {
            name: "search",
            in: "query",
            schema: { type: "string", minLength: 1, maxLength: 120 },
          },
          {
            name: "name",
            in: "query",
            schema: { type: "string", minLength: 1, maxLength: 120 },
          },
          {
            name: "minPrice",
            in: "query",
            schema: { type: "number", minimum: 0 },
          },
          {
            name: "maxPrice",
            in: "query",
            schema: { type: "number", minimum: 0 },
          },
          {
            name: "inStock",
            in: "query",
            schema: { type: "boolean" },
          },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "price_asc", "price_desc", "name_asc"],
            },
          },
        ],
        responses: {
          200: response("Productos paginados", paginated("#/components/schemas/Product")),
          400: commonErrorResponses[400],
          500: commonErrorResponses[500],
        },
      },
      post: {
        tags: ["Products", "Admin"],
        summary: "Crear producto",
        description: "Requiere role = ADMIN.",
        security: bearerSecurity,
        requestBody: jsonBody({
          $ref: "#/components/schemas/ProductWriteRequest",
        }),
        responses: {
          201: response("Producto creado", {
            $ref: "#/components/schemas/AdminProduct",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Obtener producto activo por id",
        parameters: [idParam()],
        responses: {
          200: response("Producto", {
            $ref: "#/components/schemas/Product",
          }),
          400: commonErrorResponses[400],
          404: commonErrorResponses[404],
          500: commonErrorResponses[500],
        },
      },
      put: {
        tags: ["Products", "Admin"],
        summary: "Actualizar producto",
        description: "Requiere role = ADMIN. El body debe incluir al menos un campo.",
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({
          $ref: "#/components/schemas/ProductUpdateRequest",
        }),
        responses: {
          200: response("Producto actualizado", {
            $ref: "#/components/schemas/AdminProduct",
          }),
          ...commonErrorResponses,
        },
      },
      delete: {
        tags: ["Products", "Admin"],
        summary: "Desactivar producto",
        description: "Requiere role = ADMIN. Realiza baja logica con isActive=false.",
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          204: response("Producto desactivado"),
          ...commonErrorResponses,
        },
      },
    },
    "/products/admin": {
      get: {
        tags: ["Products", "Admin"],
        summary: "Listar productos para administracion",
        description: "Requiere role = ADMIN.",
        security: bearerSecurity,
        parameters: [
          pageParam,
          limitParam,
          { name: "search", in: "query", schema: { type: "string", minLength: 1, maxLength: 120 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ALL", "ACTIVE", "INACTIVE"] } },
          { name: "stockFilter", in: "query", schema: { type: "string", enum: ["ALL", "LOW", "OUT"] } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "name_asc", "price_asc", "price_desc", "stock_asc", "stock_desc"] } },
        ],
        responses: {
          200: response("Productos admin paginados", paginated("#/components/schemas/AdminProduct")),
          ...commonErrorResponses,
        },
      },
    },
    "/products/{id}/stock": {
      patch: {
        tags: ["Products", "Admin"],
        summary: "Actualizar stock de producto",
        description: "Requiere role = ADMIN. Stock es entero >= 0.",
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({
          type: "object",
          required: ["stock"],
          properties: {
            stock: {
              type: "integer",
              minimum: 0,
              example: 7,
            },
          },
          additionalProperties: false,
        }),
        responses: {
          200: response("Producto actualizado", {
            $ref: "#/components/schemas/AdminProduct",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Obtener carrito propio",
        security: bearerSecurity,
        responses: {
          200: response("Items de carrito", {
            type: "array",
            items: { $ref: "#/components/schemas/CartItem" },
          }),
          ...commonErrorResponses,
        },
      },
      post: {
        tags: ["Cart"],
        summary: "Agregar producto al carrito",
        description: "quantity debe ser entero >= 1 y no puede superar stock disponible.",
        security: bearerSecurity,
        requestBody: jsonBody({
          $ref: "#/components/schemas/CartItemRequest",
        }),
        responses: {
          200: response("Item agregado o actualizado", {
            $ref: "#/components/schemas/CartItem",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/cart/{id}": {
      put: {
        tags: ["Cart"],
        summary: "Actualizar cantidad de item",
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({
          type: "object",
          required: ["quantity"],
          properties: {
            quantity: { type: "integer", minimum: 1, example: 2 },
          },
          additionalProperties: false,
        }),
        responses: {
          200: response("Item actualizado", {
            $ref: "#/components/schemas/CartItem",
          }),
          ...commonErrorResponses,
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Eliminar item del carrito",
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          200: response("Item eliminado", {
            $ref: "#/components/schemas/MessageResponse",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/favorites": {
      get: {
        tags: ["Favorites"],
        summary: "Listar favoritos propios",
        security: bearerSecurity,
        responses: {
          200: response("Favoritos", {
            type: "array",
            items: { $ref: "#/components/schemas/Favorite" },
          }),
          ...commonErrorResponses,
        },
      },
      post: {
        tags: ["Favorites"],
        summary: "Agregar favorito",
        security: bearerSecurity,
        requestBody: jsonBody({
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "integer", minimum: 1, example: 1 },
          },
          additionalProperties: false,
        }),
        responses: {
          201: response("Favorito agregado", {
            $ref: "#/components/schemas/Favorite",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/favorites/{productId}": {
      delete: {
        tags: ["Favorites"],
        summary: "Eliminar favorito por productId",
        security: bearerSecurity,
        parameters: [idParam("productId")],
        responses: {
          204: response("Favorito eliminado"),
          ...commonErrorResponses,
        },
      },
    },
    "/orders": {
      post: {
        tags: ["Orders"],
        summary: "Crear orden desde carrito propio",
        security: bearerSecurity,
        responses: {
          201: response("Orden creada en estado PENDING", {
            $ref: "#/components/schemas/Order",
          }),
          ...commonErrorResponses,
        },
      },
      get: {
        tags: ["Orders", "Admin"],
        summary: "Listar todas las ordenes",
        description: "Requiere role = ADMIN.",
        security: bearerSecurity,
        parameters: [
          pageParam,
          limitParam,
          { name: "q", in: "query", schema: { type: "string", minLength: 1, maxLength: 120 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ALL", ...orderStatuses] } },
          { name: "dateFrom", in: "query", schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", example: "2026-08-01" } },
          { name: "dateTo", in: "query", schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", example: "2026-08-20" } },
        ],
        responses: {
          200: response("Ordenes admin paginadas", paginated("#/components/schemas/AdminOrder")),
          ...commonErrorResponses,
        },
      },
    },
    "/orders/my": {
      get: {
        tags: ["Orders"],
        summary: "Listar mis ordenes",
        security: bearerSecurity,
        parameters: [
          pageParam,
          limitParam,
          {
            name: "statusGroup",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "IN_PROGRESS", "DELIVERED", "CANCELLED"],
            },
          },
        ],
        responses: {
          200: response("Ordenes propias paginadas", paginated("#/components/schemas/Order")),
          ...commonErrorResponses,
        },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Obtener detalle de orden propia",
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          200: response("Orden propia", {
            $ref: "#/components/schemas/Order",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/orders/admin/{id}": {
      get: {
        tags: ["Orders", "Admin"],
        summary: "Obtener detalle admin de orden",
        description: "Requiere role = ADMIN.",
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          200: response("Orden admin", {
            $ref: "#/components/schemas/AdminOrder",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/orders/{id}/status": {
      patch: {
        tags: ["Orders", "Admin"],
        summary: "Actualizar estado de orden",
        description: "Requiere role = ADMIN. Transiciones permitidas: PENDING -> CANCELLED, PAID -> PROCESSING, PROCESSING -> SHIPPED, SHIPPED -> DELIVERED.",
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({
          type: "object",
          required: ["status"],
          properties: {
            status: {
              $ref: "#/components/schemas/OrderStatus",
            },
          },
          additionalProperties: false,
        }),
        responses: {
          200: response("Orden actualizada", {
            $ref: "#/components/schemas/Order",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/payments/checkout": {
      post: {
        tags: ["Payments"],
        summary: "Crear o recuperar PaymentIntent",
        description: "Requiere orden propia en estado PENDING. El frontend no confirma el pago final.",
        security: bearerSecurity,
        requestBody: jsonBody({
          $ref: "#/components/schemas/PaymentOrderRequest",
        }),
        responses: {
          200: response("Client secret de PaymentIntent", {
            type: "object",
            required: ["clientSecret"],
            properties: {
              clientSecret: {
                type: "string",
                example: "pi_..._secret_...",
              },
            },
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/payments/checkout-session": {
      post: {
        tags: ["Payments"],
        summary: "Crear o reutilizar Stripe Checkout Session",
        description: "Requiere orden propia en estado PENDING. Si existe una sesion abierta valida para la orden, se reutiliza.",
        security: bearerSecurity,
        requestBody: jsonBody({
          $ref: "#/components/schemas/PaymentOrderRequest",
        }),
        responses: {
          200: response("URL de Stripe Checkout", {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                format: "uri",
                example: "https://checkout.stripe.com/c/pay/cs_test_...",
              },
            },
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Obtener perfil propio",
        security: bearerSecurity,
        parameters: [pageParam, limitParam],
        responses: {
          200: response("Perfil propio con ordenes paginadas", {
            $ref: "#/components/schemas/UserProfile",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/users/me/password": {
      patch: {
        tags: ["Users"],
        summary: "Cambiar contrasena propia",
        security: bearerSecurity,
        requestBody: jsonBody({
          $ref: "#/components/schemas/ChangePasswordRequest",
        }),
        responses: {
          200: response("Contrasena actualizada", {
            $ref: "#/components/schemas/MessageResponse",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/users/admin": {
      get: {
        tags: ["Users", "Admin"],
        summary: "Verificar acceso admin",
        description: "Endpoint existente que responde mensaje simple si el usuario tiene role = ADMIN.",
        security: bearerSecurity,
        responses: {
          200: response("Mensaje admin", {
            $ref: "#/components/schemas/MessageResponse",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/users": {
      get: {
        tags: ["Users", "Admin"],
        summary: "Listar usuarios",
        description: "Requiere role = ADMIN.",
        security: bearerSecurity,
        parameters: [
          pageParam,
          limitParam,
          { name: "search", in: "query", schema: { type: "string", minLength: 1, maxLength: 120 } },
          { name: "role", in: "query", schema: { type: "string", enum: ["ALL", "USER", "ADMIN"] } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: response("Usuarios paginados", paginated("#/components/schemas/AdminUser")),
          ...commonErrorResponses,
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users", "Admin"],
        summary: "Obtener perfil de usuario",
        description: "Requiere role = ADMIN.",
        security: bearerSecurity,
        parameters: [idParam(), pageParam, limitParam],
        responses: {
          200: response("Perfil de usuario", {
            $ref: "#/components/schemas/UserProfile",
          }),
          ...commonErrorResponses,
        },
      },
      delete: {
        tags: ["Users", "Admin"],
        summary: "Desactivar usuario",
        description: "Requiere role = ADMIN. Realiza baja logica con isActive=false.",
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          204: response("Usuario desactivado"),
          ...commonErrorResponses,
        },
      },
    },
    "/users/{id}/role": {
      patch: {
        tags: ["Users", "Admin"],
        summary: "Actualizar rol de usuario",
        description: "Requiere role = ADMIN. Roles validos: USER, ADMIN.",
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["USER", "ADMIN"] },
          },
          additionalProperties: false,
        }),
        responses: {
          200: response("Usuario actualizado", {
            $ref: "#/components/schemas/AdminUser",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/users/{id}/status": {
      patch: {
        tags: ["Users", "Admin"],
        summary: "Activar/desactivar usuario",
        description: "Requiere role = ADMIN.",
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({
          type: "object",
          required: ["isActive"],
          properties: {
            isActive: { type: "boolean", example: false },
          },
          additionalProperties: false,
        }),
        responses: {
          200: response("Usuario actualizado", {
            $ref: "#/components/schemas/AdminUser",
          }),
          ...commonErrorResponses,
        },
      },
    },
    "/dashboard/admin": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard administrativo",
        description: "Requiere role = ADMIN.",
        security: bearerSecurity,
        responses: {
          200: response("Metricas admin reales", {
            $ref: "#/components/schemas/AdminDashboard",
          }),
          ...commonErrorResponses,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    responses: {
      BadRequest: errorResponse("Solicitud invalida o datos invalidos"),
      Unauthorized: errorResponse("Token faltante, invalido o credenciales invalidas"),
      Forbidden: errorResponse("Usuario sin permisos o cuenta deshabilitada"),
      NotFound: errorResponse("Recurso no encontrado"),
      Conflict: errorResponse("Conflicto de estado o recurso duplicado"),
      InternalError: errorResponse("Error interno del servidor"),
    },
    schemas: {
      ApiError: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Datos invalidos" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    path: { type: "string", example: "quantity" },
                    message: { type: "string", example: "Invalid input" },
                  },
                },
              },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        required: ["page", "limit", "total", "totalPages", "hasNextPage", "hasPreviousPage"],
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 5 },
          hasNextPage: { type: "boolean", example: true },
          hasPreviousPage: { type: "boolean", example: false },
        },
      },
      OrderStatus: {
        type: "string",
        enum: orderStatuses,
      },
      AuthUser: {
        type: "object",
        required: ["id", "firstName", "lastName", "email"],
        properties: {
          id: { type: "integer", example: 1 },
          firstName: { type: "string", example: "User" },
          lastName: { type: "string", example: "Demo" },
          email: { type: "string", format: "email", example: "user@example.com" },
        },
      },
      AdminUser: {
        allOf: [
          { $ref: "#/components/schemas/AuthUser" },
          {
            type: "object",
            required: ["role", "isActive", "createdAt"],
            properties: {
              role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
              isActive: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      UserProfile: {
        allOf: [
          { $ref: "#/components/schemas/AdminUser" },
          {
            type: "object",
            required: ["orders", "ordersPagination"],
            properties: {
              orders: {
                type: "array",
                items: { $ref: "#/components/schemas/Order" },
              },
              ordersPagination: { $ref: "#/components/schemas/Pagination" },
            },
          },
        ],
      },
      RegisterRequest: {
        type: "object",
        required: ["firstName", "lastName", "email", "password"],
        properties: {
          firstName: { type: "string", minLength: 2, maxLength: 80, example: "User" },
          lastName: { type: "string", minLength: 2, maxLength: 80, example: "Demo" },
          email: { type: "string", format: "email", maxLength: 255, example: "user@example.com" },
          password: { type: "string", minLength: 8, maxLength: 128, example: "User123!" },
        },
        additionalProperties: false,
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", example: "User123!" },
        },
        additionalProperties: false,
      },
      LoginResponse: {
        type: "object",
        required: ["accessToken", "refreshToken"],
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", maxLength: 5000 },
        },
        additionalProperties: false,
      },
      RefreshTokenResponse: {
        type: "object",
        required: ["accessToken"],
        properties: {
          accessToken: { type: "string" },
        },
      },
      Product: {
        type: "object",
        required: ["id", "name", "description", "price", "stock", "createdAt"],
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Auriculares Pro" },
          description: { type: "string", example: "Auriculares de desarrollo" },
          imageUrl: { type: ["string", "null"], example: "" },
          price: decimal,
          stock: { type: "integer", minimum: 0, example: 12 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AdminProduct: {
        allOf: [
          { $ref: "#/components/schemas/Product" },
          {
            type: "object",
            required: ["isActive"],
            properties: {
              isActive: { type: "boolean", example: true },
            },
          },
        ],
      },
      ProductWriteRequest: {
        type: "object",
        required: ["name", "description", "price", "stock"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 120, example: "Auriculares Pro" },
          description: { type: "string", minLength: 5, maxLength: 2000, example: "Auriculares de desarrollo" },
          imageUrl: { type: "string", maxLength: 1000, example: "" },
          price: { type: "number", exclusiveMinimum: 0, example: 99.99 },
          stock: { type: "integer", minimum: 0, example: 12 },
        },
        additionalProperties: false,
      },
      ProductUpdateRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 3, maxLength: 120 },
          description: { type: "string", minLength: 5, maxLength: 2000 },
          imageUrl: { type: "string", maxLength: 1000 },
          price: { type: "number", exclusiveMinimum: 0 },
          stock: { type: "integer", minimum: 0 },
        },
        additionalProperties: false,
      },
      CartItemRequest: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "integer", minimum: 1, example: 1 },
          quantity: { type: "integer", minimum: 1, example: 1 },
        },
        additionalProperties: false,
      },
      CartItem: {
        type: "object",
        required: ["id", "userId", "productId", "quantity", "createdAt"],
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 1 },
          productId: { type: "integer", example: 1 },
          quantity: { type: "integer", example: 2 },
          createdAt: { type: "string", format: "date-time" },
          product: { $ref: "#/components/schemas/AdminProduct" },
        },
      },
      Favorite: {
        type: "object",
        required: ["id", "userId", "productId", "createdAt"],
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 1 },
          productId: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          product: { $ref: "#/components/schemas/AdminProduct" },
        },
      },
      OrderItem: {
        type: "object",
        required: ["id", "orderId", "productId", "productName", "quantity", "price", "subtotal"],
        properties: {
          id: { type: "integer", example: 1 },
          orderId: { type: "integer", example: 1 },
          productId: { type: "integer", example: 1 },
          cartItemId: { type: ["integer", "null"], example: 1 },
          productName: { type: "string", example: "Auriculares Pro" },
          quantity: { type: "integer", example: 1 },
          price: decimal,
          subtotal: decimal,
          product: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
      Order: {
        type: "object",
        required: ["id", "userId", "total", "createdAt", "updatedAt", "status", "items"],
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 1 },
          total: decimal,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          status: { $ref: "#/components/schemas/OrderStatus" },
          stripePaymentIntentId: { type: ["string", "null"] },
          stripeCheckoutSessionId: { type: ["string", "null"] },
          stripeCheckoutSessionUrl: { type: ["string", "null"], format: "uri" },
          stripeCheckoutSessionExpiresAt: { type: ["string", "null"], format: "date-time" },
          stripeCheckoutSessionAttempt: { type: "integer", example: 0 },
          stripePaymentStatus: { type: ["string", "null"] },
          stripeRefundId: { type: ["string", "null"] },
          stripeRefundStatus: { type: ["string", "null"] },
          paidAt: { type: ["string", "null"], format: "date-time" },
          refundedAt: { type: ["string", "null"], format: "date-time" },
          cancelledAt: { type: ["string", "null"], format: "date-time" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" },
          },
        },
      },
      AdminOrder: {
        allOf: [
          { $ref: "#/components/schemas/Order" },
          {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/AuthUser" },
            },
          },
        ],
      },
      PaymentOrderRequest: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "integer", minimum: 1, example: 1 },
        },
        additionalProperties: false,
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", maxLength: 128 },
          newPassword: { type: "string", minLength: 8, maxLength: 128 },
        },
        additionalProperties: false,
      },
      MessageResponse: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string", example: "Operacion realizada" },
        },
      },
      AdminDashboard: {
        type: "object",
        required: [
          "revenueStatuses",
          "lowStockThreshold",
          "totalSales",
          "salesLast7Days",
          "orderCount",
          "ordersLast7Days",
          "registeredUsers",
          "productCount",
          "lowStockProducts",
          "statusCounts",
          "dailySales",
        ],
        properties: {
          revenueStatuses: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderStatus" },
          },
          lowStockThreshold: { type: "integer", example: 5 },
          totalSales: decimal,
          salesLast7Days: decimal,
          orderCount: { type: "integer", example: 12 },
          ordersLast7Days: { type: "integer", example: 3 },
          registeredUsers: { type: "integer", example: 20 },
          productCount: { type: "integer", example: 8 },
          lowStockProducts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                imageUrl: { type: ["string", "null"] },
                stock: { type: "integer" },
              },
            },
          },
          lastPurchase: {
            oneOf: [
              { $ref: "#/components/schemas/AdminOrder" },
              { type: "null" },
            ],
          },
          statusCounts: {
            type: "object",
            additionalProperties: { type: "integer" },
            example: { PAID: 3, PENDING: 1 },
          },
          dailySales: {
            type: "array",
            items: {
              type: "object",
              required: ["date", "total", "orderCount"],
              properties: {
                date: { type: "string", format: "date", example: "2026-08-20" },
                total: { type: "number", example: 99.99 },
                orderCount: { type: "integer", example: 1 },
              },
            },
          },
          topSellingProduct: {
            oneOf: [
              {
                allOf: [
                  { $ref: "#/components/schemas/Product" },
                  {
                    type: "object",
                    properties: {
                      quantitySold: { type: "integer", example: 5 },
                    },
                  },
                ],
              },
              { type: "null" },
            ],
          },
        },
      },
    },
  },
};
