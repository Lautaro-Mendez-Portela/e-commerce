const favoriteService = require("../services/favorite.service");

exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await favoriteService.getFavorites(req.user.userId);

    res.json(favorites);
  } catch (error) {
    next(error);
  }
};

exports.addFavorite = async (req, res, next) => {
  try {
    const favorite = await favoriteService.addFavorite(
      req.user.userId,
      req.body.productId
    );

    res.status(201).json(favorite);
  } catch (error) {
    next(error);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    await favoriteService.removeFavorite(
      req.user.userId,
      req.params.productId
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
