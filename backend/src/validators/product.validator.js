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
  imageUrl: z.string().trim().url().max(1000).optional().or(z.literal("")),
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
  search: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  minPrice: optionalNonNegativeNumberQuery,
  maxPrice: optionalNonNegativeNumberQuery,
  inStock: z.preprocess((value) => {
    if (value === "" || value === undefined) {
      return undefined;
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    return value;
  }, z.boolean().optional()),
  sort: z.enum([
    "newest",
    "price_asc",
    "price_desc",
    "name_asc",
  ]).optional(),
}).strict().refine((data) => {
  if (data.minPrice === undefined || data.maxPrice === undefined) {
    return true;
  }

  return data.minPrice <= data.maxPrice;
}, {
  message: "minPrice no puede ser mayor que maxPrice",
  path: ["minPrice"],
});

exports.adminProductQuerySchema = z.object({
  page: optionalPositiveIntegerQuery,
  limit: optionalPositiveIntegerQuery,
  search: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional(),
  stockFilter: z.enum(["ALL", "LOW", "OUT"]).optional(),
  sort: z.enum([
    "newest",
    "name_asc",
    "price_asc",
    "price_desc",
    "stock_asc",
    "stock_desc",
  ]).optional(),
}).strict();

exports.updateProductStockSchema = z.object({
  stock: nonNegativeInteger,
}).strict();
