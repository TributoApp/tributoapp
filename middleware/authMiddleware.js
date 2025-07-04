const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // console.log('🔒 authMiddleware ejecutado'); // ver si se ejecuta esto
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Asegurate que decoded tenga el campo 'cuit'
  //  console.log('CUIT del usuario autenticado:', req.user.cuit); //ver en consola el cuit
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }

};


