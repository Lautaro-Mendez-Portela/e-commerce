const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const webhookRoutes = require("./routes/webhook.routes");
const cartRoutes = require("./routes/cart.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

app.use(cors());

/*
  Webhook ANTES de express.json()
*/
app.use("/payments", webhookRoutes);

/*
  JSON parser para el resto
*/
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);
app.use("/cart", cartRoutes);
app.use("/dashboard", dashboardRoutes);

module.exports = app;
