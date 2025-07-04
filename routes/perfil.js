const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, (req, res) => {
  res.json({
    email: req.user.email,
    cuit: req.user.cuit
  });
});

module.exports = router;
