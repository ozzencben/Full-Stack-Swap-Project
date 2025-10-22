const jwt = require("jsonwebtoken");

const authOptional = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null; // giriş yok
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id }; // giriş yapmış kullanıcı
    next();
  } catch (error) {
    req.user = null; // geçersiz token
    next();
  }
};

module.exports = authOptional;
