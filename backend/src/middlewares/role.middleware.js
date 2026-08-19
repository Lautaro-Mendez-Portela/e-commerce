const AppError = require("../utils/app-error");

exports.roleMiddleware = (role) => {

  return (req, res, next) => {

    if (req.user.role !== role) {
      return next(new AppError(403, "FORBIDDEN", "No autorizado"));
    }

    next();
  };
};
