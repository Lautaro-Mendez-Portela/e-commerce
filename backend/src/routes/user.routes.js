const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");


const { authMiddleware } = require("../middlewares/auth.middleware");

const { roleMiddleware } = require("../middlewares/role.middleware");
const {
  validate
} = require("../middlewares/validation.middleware");
const {
  changePasswordSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userParamsSchema,
  userQuerySchema
} = require("../validators/user.validator");

router.get(
  "/me",
  authMiddleware,
  validate({
    query: userQuerySchema
  }),
  userController.getMyProfile
);

router.patch(
  "/me/password",
  authMiddleware,
  validate({
    body: changePasswordSchema
  }),
  userController.changeMyPassword
);

router.get("/admin", authMiddleware, roleMiddleware("ADMIN"), (req, res) => {
  res.json({
    message: "Bienvenido admin",
  });
});

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    query: userQuerySchema
  }),
  userController.getUsers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    params: userParamsSchema,
    query: userQuerySchema
  }),
  userController.getUserProfile
);

router.patch(
  "/:id/role",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    params: userParamsSchema,
    body: updateUserRoleSchema
  }),
  userController.updateUserRole
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    params: userParamsSchema,
    body: updateUserStatusSchema
  }),
  userController.updateUserStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate({
    params: userParamsSchema
  }),
  userController.deleteUser
);

module.exports = router;
