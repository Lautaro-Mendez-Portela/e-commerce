const {
  idParamSchema,
  optionalPositiveIntegerQuery,
} = require("./common.validator");
const { z } = require("zod");

const userRoleSchema = z.enum(["USER", "ADMIN"]);

exports.userParamsSchema = idParamSchema;
exports.userQuerySchema = z.object({
  page: optionalPositiveIntegerQuery,
  limit: optionalPositiveIntegerQuery,
  search: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["ALL", "USER", "ADMIN"]).optional(),
  isActive: z.preprocess((value) => {
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
}).strict();

exports.updateUserRoleSchema = z.object({
  role: userRoleSchema,
}).strict();

exports.updateUserStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();

exports.changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
}).strict().refine((value) => {
  return value.currentPassword !== value.newPassword;
}, {
  message: "La nueva contrasena debe ser diferente",
  path: ["newPassword"],
});
