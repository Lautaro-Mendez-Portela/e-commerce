const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");
const prisma = require("./config/prisma");
const AppError = require("./utils/app-error");
const {
  errorHandler,
  notFoundHandler
} = require("./middlewares/error.middleware");
const {
  generalLimiter
} = require("./middlewares/rate-limit.middleware");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const webhookRoutes = require("./routes/webhook.routes");
const cartRoutes = require("./routes/cart.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const docsRoutes = require("./docs/docs.routes");

const app = express();

app.use(helmet());

const normalizeOrigin = (origin) => origin.replace(/\/+$/, "");

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.clientUrls.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    return callback(
      new AppError(403, "CORS_FORBIDDEN", "Origen no permitido")
    );
  },
  credentials: true,
}));

app.get("/health", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
    });
  } catch {
    next(
      new AppError(
        503,
        "HEALTHCHECK_FAILED",
        "Servicio no disponible"
      )
    );
  }
});

/*
  Webhook ANTES de express.json()
*/
app.use("/payments", webhookRoutes);

app.use(generalLimiter);

/*
  JSON parser para el resto
*/
app.use(express.json({
  limit: env.jsonBodyLimit
}));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);
app.use("/cart", cartRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/favorites", favoriteRoutes);

if (env.apiDocsEnabled) {
  app.use("/api", docsRoutes);
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
