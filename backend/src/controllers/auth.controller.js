const authService = require("../services/auth.service");

exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);

    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const data = await authService.refresh(refreshToken);

    res.json(data);

  } catch (error) {
    next(error);
  }
};
