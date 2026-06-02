const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");

const { authMiddleware } = require("../middlewares/auth.middleware");

const { roleMiddleware } = require("../middlewares/role.middleware");

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getAdminDashboard
);

module.exports = router;
