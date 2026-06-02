const { z } = require("zod");

exports.createProductSchema = z.object({

  name: z
    .string()
    .min(3),

  description: z
    .string()
    .min(5),

  imageUrl: z
    .string()
    .optional()
    .or(z.literal("")),

  price: z
    .number()
    .positive(),

  stock: z
    .number()
    .int()
    .min(0)
});
