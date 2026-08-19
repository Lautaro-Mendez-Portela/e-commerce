const { z } = require("zod");

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(255)
  .transform((value) => value.toLowerCase());

exports.registerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8).max(128),
}).strict();

exports.loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
}).strict();

exports.refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1).max(5000),
}).strict();
