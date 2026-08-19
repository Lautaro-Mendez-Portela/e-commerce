const {
  idParamSchema,
  positiveInteger,
} = require("./common.validator");
const { z } = require("zod");

exports.cartItemSchema = z.object({
  productId: positiveInteger,
  quantity: positiveInteger,
}).strict();

exports.cartQuantitySchema = z.object({
  quantity: positiveInteger,
}).strict();

exports.cartItemParamsSchema = idParamSchema;
