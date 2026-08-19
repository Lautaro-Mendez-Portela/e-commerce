const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");
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

const app = express();

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === env.clientUrl) {
      return callback(null, true);
    }

    return callback(
      new AppError(403, "CORS_FORBIDDEN", "Origen no permitido")
    );
  },
  credentials: true,
}));

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

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
