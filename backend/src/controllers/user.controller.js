const userService = require("../services/user.service");
const {
  getPaginationParams
} = require("../utils/pagination");
const AppError = require("../utils/app-error");

exports.getUsers = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const users = await userService.getUsers(pagination);

    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const user = await userService.getUserProfile(
      req.user.userId,
      pagination
    );

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const user = await userService.getUserProfile(
      req.params.id,
      pagination
    );

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.userId)) {
      throw new AppError(
        400,
        "CANNOT_DELETE_SELF",
        "No puedes eliminar tu propio usuario"
      );
    }

    await userService.deleteUser(req.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
