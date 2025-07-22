const jwt = require('jsonwebtoken');

// Middleware para verificar si el usuario está autenticado
function authenticateToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado: token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

// Middleware para verificar si el usuario tiene uno de los roles permitidos
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ mensaje: 'Prohibido: permisos insuficientes' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};