const express = require("express");

const router = express.Router();

const favoriteController = require("../controllers/favorite.controller");

const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, favoriteController.getFavorites);

router.post("/", authMiddleware, favoriteController.addFavorite);

router.delete(
  "/:productId",
  authMiddleware,
  favoriteController.removeFavorite
);

module.exports = router;
