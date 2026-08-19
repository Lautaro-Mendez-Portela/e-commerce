const { z } = require("zod");
const {
  productIdParamSchema,
  positiveInteger,
} = require("./common.validator");

exports.favoriteSchema = z.object({
  productId: positiveInteger,
}).strict();

exports.favoriteParamsSchema = productIdParamSchema;
