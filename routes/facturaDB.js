// routes/facturaDB.js
const express = require('express');
const router = express.Router();
const pool = require('./db'); // conexión a PostgreSQL
const verifyToken = require('../middleware/authMiddleware');

// Crear una factura
router.post('/facturas', verifyToken, async (req, res) => {
  const { cuit_usuario, cliente_cuit, importe, fecha } = req.body;

  try {
    // Generar el PDF (aquí deberías integrar tu función real)
    const pdfUrl = `/uploads/factura_${Date.now()}.pdf`;

    // Insertar en la base de datos
    const result = await pool.query(
      `INSERT INTO facturas_solicitadas
       (cuit_usuario, cliente_cuit, importe, fecha, pdf_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, cliente_cuit, importe, fecha, pdf_url`,
      [cuit_usuario, cliente_cuit, importe, fecha, pdfUrl]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al generar factura:", err);
    res.status(500).send("Error al generar factura");
  }
});

// Obtener facturas del usuario o todas si es admin
router.get('/facturas', verifyToken, async (req, res) => {
  const cuit_usuario = req.user.cuit;
  const CUIT_ADMIN = '20387758578'; // Ajustalo según tu admin

  try {
    let result;

    if (cuit_usuario === CUIT_ADMIN) {
      // Admin: obtener todas las facturas
      result = await pool.query(
        'SELECT id, cuit_usuario, cliente_cuit, importe, fecha, pdf_url FROM facturas_solicitadas ORDER BY fecha DESC'
      );
    } else {
      // Usuario normal: solo sus facturas
      result = await pool.query(
        'SELECT id, cliente_cuit, importe, fecha, pdf_url FROM facturas_solicitadas WHERE cuit_usuario = $1 ORDER BY fecha DESC',
        [cuit_usuario]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener facturas:", error);
    res.status(500).send("Error al obtener facturas");
  }
});

// Eliminar factura por ID
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

