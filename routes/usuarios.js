const express = require('express');
const router = express.Router(); 
const fs = require('fs');
const verifyToken = require('../middleware/authMiddleware');

router.post('/usuarios/actualizar-fin-prueba', verifyToken, async (req, res) => {
  const { cuit } = req.body;

  try {
    const users = JSON.parse(fs.readFileSync('users.json'));
    const userIndex = users.findIndex(u => u.cuit === cuit);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const nuevaFecha = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 días
    users[userIndex].fin_prueba = nuevaFecha.toISOString();

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    res.json({ message: 'Fin de prueba actualizado', nuevaFecha: nuevaFecha.toISOString() });
  } catch (err) {
    console.error('❌ Error al actualizar fin_prueba:', err);
    res.status(500).json({ message: 'Error al actualizar fin_prueba' });
  }
});

module.exports = router;