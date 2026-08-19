const { z } = require("zod");

const emptyStringToUndefined = (value) => {
  if (value === "") {
    return undefined;
  }

  return value;
};

const positiveInteger = z.number().int().positive();
const nonNegativeInteger = z.number().int().min(0);
const positiveNumber = z.number().finite().positive();

const positiveIntegerParam = z.coerce.number().int().positive();

const optionalPositiveIntegerQuery = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().positive().optional()
);

const optionalNonNegativeNumberQuery = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().finite().nonnegative().optional()
);

exports.positiveInteger = positiveInteger;
exports.nonNegativeInteger = nonNegativeInteger;
exports.positiveNumber = positiveNumber;
exports.idParamSchema = z.object({
  id: positiveIntegerParam,
}).strict();
exports.productIdParamSchema = z.object({
  productId: positiveIntegerParam,
}).strict();
exports.paginationQuerySchema = z.object({
  page: optionalPositiveIntegerQuery,
  limit: optionalPositiveIntegerQuery,
}).strict();
exports.optionalPositiveIntegerQuery = optionalPositiveIntegerQuery;
exports.optionalNonNegativeNumberQuery = optionalNonNegativeNumberQuery;
