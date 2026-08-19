const {
  idParamSchema,
  paginationQuerySchema,
} = require("./common.validator");

exports.userParamsSchema = idParamSchema;
exports.userQuerySchema = paginationQuerySchema;
