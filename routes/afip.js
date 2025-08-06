// routes/afip.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const emitirConAfip = require('../controllers/afipController').emitirFactura;

router.post('/emitir', verifyToken, emitirConAfip);

module.exports = router;
