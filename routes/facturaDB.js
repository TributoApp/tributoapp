// routes/facturaDB.js
const express = require('express');
const router = express.Router();
const pool = require('./db'); // conexión a PostgreSQL
const verifyToken = require('../middleware/authMiddleware');
//const upload = require('../middleware/upload');

router.post('/facturas', verifyToken, async (req, res) => {
  const { cuit_usuario, cliente_cuit, importe, fecha } = req.body;

  try {
    // 1️⃣ Acá generás el PDF y obtenés la URL o path donde se guarda
    const pdfUrl = `/uploads/factura_${Date.now()}.pdf`;

    // 2️⃣ Insertar en base con la URL del PDF
    const result = await pool.query(
      `INSERT INTO facturas_solicitadas
       (cuit_usuario, cliente_cuit, importe, fecha, pdf_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cuit_usuario, cliente_cuit, importe, fecha, pdfUrl]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al generar factura:", err);
    res.status(500).send("Error al generar factura");
  }
});


// Obtener facturas de los usuarios
router.get('/facturas', verifyToken, async (req, res) => {
  const cuit_usuario = req.user.cuit;
  const CUIT_ADMIN = '20387758578'; // Ajustalo si tu admin tiene otro CUIT

  try {
    let result;

    if (cuit_usuario === CUIT_ADMIN) {
      // Admin: obtener todas las facturas
      result = await pool.query(
        'SELECT * FROM facturas_solicitadas ORDER BY fecha_creacion DESC'
      );
    } else {
      // Usuario normal: solo sus facturas
      result = await pool.query(
        'SELECT * FROM facturas_solicitadas WHERE cuit_usuario = $1 ORDER BY fecha_creacion DESC',
        [cuit_usuario]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener facturas:", error);
    res.status(500).send("Error al obtener facturas");
  }
});


// ✅ Actualizar el estado de una factura (admin)
router.put('/facturas/:id/estado', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const result = await pool.query(
      'UPDATE facturas_solicitadas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    res.json({ message: 'Factura actualizada', factura: result.rows[0] });
  } catch (error) {
    console.error("❌ Error al actualizar factura:", error);
    res.status(500).json({ message: 'Error al actualizar factura' });
  }
});

// DELETE factura por ID
router.delete('/facturas/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM facturas_solicitadas WHERE id = $1', [id]);
    res.json({ message: 'Factura eliminada correctamente' });
  } catch (error) {
    console.error("❌ Error al eliminar factura:", error);
    res.status(500).json({ message: 'Error al eliminar factura' });
  }
});

module.exports = router;

