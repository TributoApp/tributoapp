const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // ajustar según entorno
});

exports.register = async (req, res) => {
  const { nombre, email, cuit, password } = req.body;

  if (!nombre || !email || !cuit || !password) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  if (!/^\d{11}$/.test(cuit)) {
    return res.status(400).json({ message: 'CUIT inválido' });
  }

  try {
    // Verificar si existe usuario con email o cuit
    const exists = await pool.query(
      'SELECT 1 FROM usuarios WHERE email = $1 OR cuit = $2',
      [email, cuit]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'Email o CUIT ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Calcular fin_prueba: 30 días desde hoy
    const finPrueba = new Date();
    finPrueba.setDate(finPrueba.getDate() + 30);

    const now = new Date();

    // Insertar usuario
    await pool.query(
      `INSERT INTO usuarios (nombre, email, cuit, password, registro, fin_prueba, iibb)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nombre, email, cuit, hashedPassword, now, finPrueba, 3.5]
    );

    res.json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ahora = new Date();
    const finPrueba = new Date(user.fin_prueba);

    if (ahora > finPrueba) {
      return res.status(403).json({ message: 'Período de prueba finalizado. Debe contratar el servicio.' });
    }

    const token = jwt.sign(
      {
        email: user.email,
        cuit: user.cuit,
        registro: user.registro,
        fin_prueba: user.fin_prueba
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        email: user.email,
        cuit: user.cuit,
        registro: user.registro,
        fin_prueba: user.fin_prueba,
        iibb: user.iibb ?? 3.5
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
