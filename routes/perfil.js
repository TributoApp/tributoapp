const express = require('express');
const pool = require('./db');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, (req, res) => {
  res.json({
    email: req.user.email,
    cuit: req.user.cuit
  });
});

// Nueva ruta para guardar datos fiscales
router.post('/datos-fiscales', authMiddleware, async (req, res) => {
  const { domicilio_fiscal, nombre_fantasia, numiibb, inicio_actividades } = req.body;
  const cuit = req.user.cuit;

  try {
    await pool.query(
      `UPDATE usuarios 
       SET domicilio_fiscal = $1,
           nombre_fantasia = $2,
           numiibb = $3,
           inicio_actividades = $4
       WHERE cuit = $5`,
      [domicilio_fiscal, nombre_fantasia || null, numiibb, inicio_actividades, cuit]
    );

    res.json({ message: 'Datos fiscales guardados correctamente.' });
  } catch (error) {
    console.error('Error al guardar datos fiscales:', error);
    res.status(500).json({ message: 'Error al guardar los datos fiscales.' });
  }
});

// Obtener datos fiscales del usuario
router.get('/datos-fiscales', authMiddleware, async (req, res) => {
  const cuit = req.user.cuit;

  try {
    const resultado = await pool.query(
      `SELECT domicilio_fiscal, nombre_fantasia, numiibb, inicio_actividades
       FROM usuarios
       WHERE cuit = $1`,
      [cuit]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: 'Datos no encontrados' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener datos fiscales:', error);
    res.status(500).json({ message: 'Error al obtener los datos fiscales' });
  }
});



module.exports = router;
