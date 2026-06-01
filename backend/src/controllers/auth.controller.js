const authService = require("../services/auth.service");

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const data = await authService.refresh(refreshToken);

    res.json(data);

  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
};