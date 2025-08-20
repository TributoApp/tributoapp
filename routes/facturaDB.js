// routes/facturaDB.js
const express = require('express');
const router = express.Router();
const pool = require('./db'); // conexión a PostgreSQL
const verifyToken = require('../middleware/authMiddleware');

// Crear una factura con PDF en la DB
router.post('/facturas', verifyToken, async (req, res) => {
  const { cuit_usuario, cliente_cuit, importe, fecha } = req.body;

  try {
    // 🔹 Generar el contenido del PDF (ejemplo simple)
    // En producción deberías usar pdfkit / pdfmake para armarlo bien
    const contenido = `
      FACTURA
      ------------
      CUIT: ${cuit_usuario}
      Cliente CUIT: ${cliente_cuit}
      Importe: $${importe}
      Fecha: ${fecha}
    `;
    const pdfBuffer = Buffer.from(contenido, 'utf-8'); // reemplazar por buffer real de PDF

    // Guardar en DB
    const result = await pool.query(
      `INSERT INTO facturas_solicitadas
       (cuit_usuario, cliente_cuit, importe, fecha, pdf_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, cliente_cuit, importe, fecha`,
      [cuit_usuario, cliente_cuit, importe, fecha, pdfBuffer]
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
  const CUIT_ADMIN = '20387758578';

  try {
    let result;

    if (cuit_usuario === CUIT_ADMIN) {
      result = await pool.query(
        'SELECT id, cuit_usuario, cliente_cuit, importe, fecha FROM facturas_solicitadas ORDER BY fecha DESC'
      );
    } else {
      result = await pool.query(
        'SELECT id, cliente_cuit, importe, fecha FROM facturas_solicitadas WHERE cuit_usuario = $1 ORDER BY fecha DESC',
        [cuit_usuario]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener facturas:", error);
    res.status(500).send("Error al obtener facturas");
  }
});

// 📄 Nuevo endpoint: devolver PDF desde DB
router.get('/facturas/:id/pdf', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT pdf_data FROM facturas_solicitadas WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const pdfBuffer = result.rows[0].pdf_data;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="factura_${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ Error al obtener PDF:", err);
    res.status(500).json({ error: 'Error al obtener PDF' });
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

