const { z } = require("zod");
const {
  idParamSchema,
  nonNegativeInteger,
  optionalNonNegativeNumberQuery,
  optionalPositiveIntegerQuery,
  positiveNumber,
} = require("./common.validator");

const productFieldsSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(2000),
  imageUrl: z.string().max(1_000_000).optional().or(z.literal("")),
  price: positiveNumber,
  stock: nonNegativeInteger,
}).strict();

exports.createProductSchema = productFieldsSchema;

exports.updateProductSchema = productFieldsSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviarse al menos un campo para actualizar",
  });

exports.productParamsSchema = idParamSchema;

exports.productQuerySchema = z.object({
  page: optionalPositiveIntegerQuery,
  limit: optionalPositiveIntegerQuery,
  name: z.string().trim().min(1).max(120).optional(),
  minPrice: optionalNonNegativeNumberQuery,
  maxPrice: optionalNonNegativeNumberQuery,
}).strict().refine((data) => {
  if (data.minPrice === undefined || data.maxPrice === undefined) {
    return true;
  }

  return data.minPrice <= data.maxPrice;
}, {
  message: "minPrice no puede ser mayor que maxPrice",
  path: ["minPrice"],
});
