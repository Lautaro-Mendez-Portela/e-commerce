const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Token requerido"
    });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      "secret"
    );

    req.user = decoded;

    next();

  } catch {
    return res.status(401).json({
      error: "Token inválido"
    });
  }
};