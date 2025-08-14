// Este archivo se encarga de enviar la factura y solicitud IIBB por WhatsApp
const express = require('express');
const router = express.Router();
const axios = require('axios');
const verifyToken = require('../middleware/authMiddleware'); // 👈 agregado
const fetch = require('node-fetch'); // 👈 agregado para llamadas fetch

// Configuración de CallMeBot
const ADMIN_PHONE = '5493764246978'; // 👈 tu número con código de país
const CALLMEBOT_APIKEY = '8974175'; // 👈 tu API Key CallMeBot

// 📤 Ruta para solicitud de formulario 322 / IIBB
router.post('/iibb', verifyToken, async (req, res) => {
  const { cuit_usuario } = req.body;

  try {
    const mensaje = `Solicitud de Libre Deuda/Formulario 322 para el CUIT: ${cuit_usuario}`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${encodeURIComponent(mensaje)}&apikey=${CALLMEBOT_APIKEY}`;
    await fetch(url);

    res.json({ success: true, message: 'Mensaje enviado por WhatsApp' });
  } catch (err) {
    console.error("❌ Error al enviar mensaje de IIBB:", err);
    res.status(500).json({ message: 'Error al enviar solicitud de IIBB' });
  }
});

// POST /api/facturasmail/ddjj
router.post('/ddjj', verifyToken, async (req, res) => {
  const { cuit_usuario } = req.body;

  try {
    const mensaje = `Solicitud de Declaración Jurada de IIBB\nCUIT: ${cuit_usuario}`;

    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${encodeURIComponent(mensaje)}&apikey=${CALLMEBOT_APIKEY}`;
    await fetch(url);

    res.json({ success: true, message: 'Mensaje enviado por WhatsApp' });
  } catch (err) {
    console.error("❌ Error al enviar solicitud de DDJJ:", err);
    res.status(500).json({ message: 'Error al enviar solicitud de DDJJ' });
  }
});


module.exports = router

