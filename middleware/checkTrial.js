// middleware/checkTrial.js
const fs = require('fs');
const USERS_FILE = 'users.json';

module.exports = (req, res, next) => {
  const { email } = req.user; // Viene del token verificado

  if (!email) {
    return res.status(401).json({ message: 'No se pudo verificar el usuario' });
  }

  const users = fs.existsSync(USERS_FILE)
    ? JSON.parse(fs.readFileSync(USERS_FILE))
    : [];

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const ahora = new Date();
  const finPrueba = new Date(user.fin_prueba);

  if (ahora > finPrueba) {
    return res.status(403).json({
      message: 'Tu período de prueba ha finalizado. Por favor, activá tu suscripción.'
    });
  }

  next();
};
