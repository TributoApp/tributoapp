// routes/admin.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const cuitAdmin = '20387758578'; // CUIT autorizado

// Obtener todos los usuarios (solo admin)
router.get('/usuarios', verifyToken, async (req, res) => {
  if (req.user.cuit !== cuitAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo el administrador puede ver esta información.' });
  }

  try {
    const result = await pool.query(
      'SELECT nombre, email, cuit, iibb FROM usuarios ORDER BY registro DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error en GET /usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Editar porcentaje IIBB (solo admin)
router.post('/usuarios/editar-iibb', verifyToken, async (req, res) => {
  const { cuit, nuevoPorcentaje } = req.body;

  if (req.user.cuit !== cuitAdmin) {
    return res.status(403).json({ message: 'Solo el administrador puede editar IIBB' });
  }

  if (!cuit || isNaN(nuevoPorcentaje)) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  try {
    const result = await pool.query(
      'UPDATE usuarios SET iibb = $1 WHERE cuit = $2 RETURNING *',
      [nuevoPorcentaje, cuit]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'IIBB actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al editar IIBB:', error);
    res.status(500).json({ message: 'Error al actualizar el porcentaje' });
  }
});

module.exports = router;



