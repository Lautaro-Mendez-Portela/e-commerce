const favoriteService = require("../services/favorite.service");

exports.getFavorites = async (req, res) => {
  try {
    const favorites = await favoriteService.getFavorites(req.user.userId);

    res.json(favorites);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const favorite = await favoriteService.addFavorite(
      req.user.userId,
      req.body.productId
    );

    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    await favoriteService.removeFavorite(
      req.user.userId,
      req.params.productId
    );

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
