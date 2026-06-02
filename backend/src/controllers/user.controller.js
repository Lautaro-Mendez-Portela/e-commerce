const userService = require("../services/user.service");
const {
  getPaginationParams
} = require("../utils/pagination");

exports.getUsers = async (req, res) => {
  try {
    const pagination = getPaginationParams(req.query);
    const users = await userService.getUsers(pagination);

    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const pagination = getPaginationParams(req.query);
    const user = await userService.getUserProfile(
      req.user.userId,
      pagination
    );

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const pagination = getPaginationParams(req.query);
    const user = await userService.getUserProfile(
      req.params.id,
      pagination
    );

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.userId)) {
      return res.status(400).json({
        error: "No puedes eliminar tu propio usuario",
      });
    }

    await userService.deleteUser(req.params.id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
