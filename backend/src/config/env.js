const dotenv = require("dotenv");

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const requiredVariables = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const productionRequiredVariables = [
  "PORT",
  "API_URL",
];

const allRequiredVariables = isProduction
  ? [...requiredVariables, ...productionRequiredVariables]
  : requiredVariables;

const missingProductionVariables = allRequiredVariables.filter(
  (key) => !process.env[key] || process.env[key].trim() === ""
);

if (missingProductionVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingProductionVariables.join(", ")}`
  );
}

const trimTrailingSlash = (value) => value.trim().replace(/\/+$/, "");

const localHosts = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

const parsePort = (value) => {
  if (!value || value.trim() === "") {
    if (isProduction) {
      throw new Error("Missing required environment variables: PORT");
    }

    return 3000;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return parsed;
};

const parsePublicUrl = (key, value) => {
  const normalized = trimTrailingSlash(value);
  let parsed;

  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }

  if (isProduction) {
    if (parsed.protocol !== "https:") {
      throw new Error(`${key} must use https in production`);
    }

    if (localHosts.has(parsed.hostname)) {
      throw new Error(`${key} must not point to localhost in production`);
    }
  }

  return normalized;
};

const parseClientUrls = (value) => {
  const urls = value
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => parsePublicUrl(`CLIENT_URL[${index}]`, url));

  if (urls.length === 0) {
    throw new Error("CLIENT_URL must include at least one URL");
  }

  return urls;
};

const clientUrls = parseClientUrls(process.env.CLIENT_URL);

module.exports = {
  nodeEnv,
  isProduction,
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  clientUrl: clientUrls[0],
  clientUrls,
  apiUrl: process.env.API_URL
    ? parsePublicUrl("API_URL", process.env.API_URL)
    : undefined,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  apiDocsEnabled: process.env.API_DOCS_ENABLED !== "false",
};
