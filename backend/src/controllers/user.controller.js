const userService = require("../services/user.service");

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();

    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};