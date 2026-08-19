const { z } = require("zod");
const { positiveInteger } = require("./common.validator");

exports.paymentOrderSchema = z.object({
  orderId: positiveInteger,
}).strict();
