// routes/admin.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '../users.json');
const cuitAdmin = '20387758578'; // CUIT autorizado

// Obtener todos los usuarios (solo para admin)
router.get('/usuarios', verifyToken, (req, res) => {
  try {
    if (req.user.cuit !== cuitAdmin) {
      return res.status(403).json({ message: 'Acceso denegado. Solo el administrador puede ver esta información.' });
    }

    const data = fs.readFileSync(usersFile, 'utf8');
    const usuarios = JSON.parse(data);

    if (!Array.isArray(usuarios)) {
      return res.status(500).json({ message: 'Formato inválido en users.json' });
    }

    res.json(usuarios);
  } catch (err) {
    console.error('❌ Error en GET /usuarios:', err);
    res.status(500).json({ message: 'Error al leer los usuarios.' });
  }
});

// ✅ Nuevo endpoint para actualizar porcentaje de IIBB
router.post('/usuarios/editar-iibb', verifyToken, (req, res) => {
  const { cuit, nuevoPorcentaje } = req.body;

  if (req.user.cuit !== cuitAdmin) {
    return res.status(403).json({ message: 'Solo el administrador puede editar IIBB' });
  }

  if (!cuit || isNaN(nuevoPorcentaje)) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  try {
    const data = fs.readFileSync(usersFile, 'utf8');
    const usuarios = JSON.parse(data);

    const index = usuarios.findIndex(u => u.cuit === cuit);
    if (index === -1) return res.status(404).json({ message: 'Usuario no encontrado' });

    usuarios[index].iibb = nuevoPorcentaje;

    fs.writeFileSync(usersFile, JSON.stringify(usuarios, null, 2));
    res.json({ message: 'IIBB actualizado correctamente' });

  } catch (err) {
    console.error('❌ Error al editar IIBB:', err);
    res.status(500).json({ message: 'Error al actualizar el porcentaje' });
  }
});

module.exports = router;


