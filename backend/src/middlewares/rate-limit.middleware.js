const rateLimit = require("express-rate-limit");

const rateLimitResponse = (code, message) => (req, res, next, options) => {
  res.status(options.statusCode).json({
    error: {
      code,
      message,
    },
  });
};

exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse(
    "RATE_LIMIT_EXCEEDED",
    "Demasiadas solicitudes. Intenta nuevamente mas tarde."
  ),
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse(
    "AUTH_RATE_LIMIT_EXCEEDED",
    "Demasiados intentos de autenticacion. Intenta nuevamente mas tarde."
  ),
});
