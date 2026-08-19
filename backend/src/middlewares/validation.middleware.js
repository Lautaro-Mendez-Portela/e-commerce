const AppError = require("../utils/app-error");

const formatIssues = (issues) => {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
};

exports.validate = (schemas) => {
  const normalizedSchemas = schemas.safeParse
    ? {
        body: schemas,
      }
    : schemas;

  return (req, res, next) => {
    for (const location of ["params", "query", "body"]) {
      const schema = normalizedSchemas[location];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[location]);

      if (!result.success) {
        return next(
          new AppError(
            400,
            "VALIDATION_ERROR",
            "Datos invalidos",
            formatIssues(result.error.issues)
          )
        );
      }

      req[location] = result.data;
    }

    next();
  };
};
