const { z } = require("zod");
const {
  idParamSchema,
  optionalPositiveIntegerQuery,
} = require("./common.validator");

const dateQuerySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const orderStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
]);

exports.adminOrdersQuerySchema = z.object({
  page: optionalPositiveIntegerQuery,
  limit: optionalPositiveIntegerQuery,
  status: z.enum([
    "ALL",
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "FAILED",
  ]).optional(),
  dateFrom: dateQuerySchema.optional(),
  dateTo: dateQuerySchema.optional(),
}).strict().refine((value) => {
  if (!value.dateFrom || !value.dateTo) {
    return true;
  }

  return value.dateFrom <= value.dateTo;
}, {
  message: "dateFrom no puede ser posterior a dateTo",
  path: ["dateFrom"],
});

exports.orderParamsSchema = idParamSchema;

exports.updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
}).strict();
