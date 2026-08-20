const dotenv = require("dotenv");

dotenv.config();

const requiredVariables = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const missingVariables = requiredVariables.filter(
  (key) => !process.env[key] || process.env[key].trim() === ""
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}`
  );
}

const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? fallback : parsed;
};

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInteger(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  clientUrl: trimTrailingSlash(process.env.CLIENT_URL),
  apiUrl: process.env.API_URL
    ? trimTrailingSlash(process.env.API_URL)
    : undefined,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  apiDocsEnabled: process.env.API_DOCS_ENABLED !== "false",
};
