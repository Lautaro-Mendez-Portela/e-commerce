const AppError = require("../utils/app-error");
const env = require("../config/env");

const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error.type === "entity.parse.failed") {
    return new AppError(400, "INVALID_JSON", "JSON invalido");
  }

  if (error.type === "entity.too.large") {
    return new AppError(413, "BODY_TOO_LARGE", "El cuerpo de la solicitud es demasiado grande");
  }

  if (error.code === "P2025") {
    return new AppError(404, "NOT_FOUND", "Recurso no encontrado");
  }

  if (error.code === "P2002") {
    return new AppError(409, "CONFLICT", "El recurso ya existe");
  }

  if (error.code === "P2003") {
    return new AppError(400, "INVALID_REFERENCE", "Referencia invalida");
  }

  const statusCode = error.statusCode || error.status || 500;

  return new AppError(
    statusCode,
    statusCode >= 500 ? "INTERNAL_ERROR" : error.code || "REQUEST_ERROR",
    statusCode >= 500 ? "Error interno del servidor" : error.message
  );
};

exports.notFoundHandler = (req, res, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", "Ruta no encontrada"));
};

exports.errorHandler = (error, req, res, next) => {
  const normalizedError = normalizeError(error);
  const response = {
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
    },
  };

  if (normalizedError.details) {
    response.error.details = normalizedError.details;
  }

  if (!env.isProduction && error.stack) {
    response.error.stack = error.stack;
  }

  res.status(normalizedError.statusCode).json(response);
};
