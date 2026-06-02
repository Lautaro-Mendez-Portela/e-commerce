const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");


const { authMiddleware } = require("../middlewares/auth.middleware");

const { roleMiddleware } = require("../middlewares/role.middleware");

router.get("/me", authMiddleware, userController.getMyProfile);

router.get("/admin", authMiddleware, roleMiddleware("ADMIN"), (req, res) => {
  res.json({
    message: "Bienvenido admin",
  });
});

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.getUsers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.getUserProfile
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.deleteUser
);

module.exports = router;
