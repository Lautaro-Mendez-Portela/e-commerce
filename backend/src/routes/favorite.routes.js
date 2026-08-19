const express = require("express");

const router = express.Router();

const favoriteController = require("../controllers/favorite.controller");

const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  validate
} = require("../middlewares/validation.middleware");
const {
  favoriteParamsSchema,
  favoriteSchema
} = require("../validators/favorite.validator");

router.get("/", authMiddleware, favoriteController.getFavorites);

router.post(
  "/",
  authMiddleware,
  validate({
    body: favoriteSchema
  }),
  favoriteController.addFavorite
);

router.delete(
  "/:productId",
  authMiddleware,
  validate({
    params: favoriteParamsSchema
  }),
  favoriteController.removeFavorite
);

module.exports = router;
