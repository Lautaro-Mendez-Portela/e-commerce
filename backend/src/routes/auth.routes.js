const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const {
  validate
} = require("../middlewares/validation.middleware");
const {
  authLimiter
} = require("../middlewares/rate-limit.middleware");
const {
  loginSchema,
  refreshTokenSchema,
  registerSchema
} = require("../validators/auth.validator");

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refresh
);

module.exports = router;
