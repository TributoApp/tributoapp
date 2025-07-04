const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const USERS_FILE = 'users.json';

exports.register = async (req, res) => {
  const { nombre, email, cuit, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Usuario ya registrado' });
  }

  const now = new Date();
  const registro = now.toISOString();
  const fin_prueba = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 días

  users.push({
    nombre,
    email,
    cuit,
    password: hashedPassword,
    registro,
    fin_prueba,
    iibb: 3.5
  });

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  res.json({ message: 'Usuario registrado correctamente' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
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
};