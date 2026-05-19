const express = require("express");
const router = express.Router();

const {
  authMiddleware
} = require("../middlewares/auth.middleware");

const {
  roleMiddleware
} = require("../middlewares/role.middleware");

router.get(
  "/me",
  authMiddleware,
  (req, res) => {

    res.json({
      message: "Ruta protegida",
      user: req.user
    });

  }
);

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req, res) => {

    res.json({
      message: "Bienvenido admin"
    });

  }
);

module.exports = router;