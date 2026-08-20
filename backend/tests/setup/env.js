process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_change_me";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test_refresh_secret_change_me";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_mock";
process.env.JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "1mb";
process.env.ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
process.env.REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://missing:missing@localhost:5432/ecommerce_test_missing";
}
