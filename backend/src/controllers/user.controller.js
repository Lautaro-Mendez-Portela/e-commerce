const userService = require("../services/user.service");
const {
  getPaginationParams
} = require("../utils/pagination");
const AppError = require("../utils/app-error");

exports.getUsers = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const users = await userService.getUsers({
      ...pagination,
      search: req.query.search,
      role: req.query.role,
      isActive: req.query.isActive,
    });

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

exports.changeMyPassword = async (req, res, next) => {
  try {
    const result = await userService.changePassword(
      req.user.userId,
      req.body
    );

    res.json(result);
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

exports.updateUserRole = async (req, res, next) => {
  try {
    const user = await userService.updateUserRole({
      actorUserId: req.user.userId,
      targetUserId: req.params.id,
      role: req.body.role,
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus({
      actorUserId: req.user.userId,
      targetUserId: req.params.id,
      isActive: req.body.isActive,
    });

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

    await userService.updateUserStatus({
      actorUserId: req.user.userId,
      targetUserId: req.params.id,
      isActive: false,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
