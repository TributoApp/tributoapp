const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Rutas principales
const authRoutes = require('./routes/auth');
const perfilRoutes = require('./routes/perfil');
const afipRoutes = require('./routes/afip');
const facturaDbRoutes = require('./routes/facturaDB'); // este es de la base de datos (database)
const facturaMailRoutes = require('./routes/facturasmail'); // se encarga de mandar el requerimiento de facturas por mail 
const adminRoutes = require('./routes/admin');
const usuarioRoutes = require('./routes/usuarios');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Usar rutas bien definidas
app.use('/api', authRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/afip', afipRoutes); //facturas reales en AFIP
app.use('/api', facturaDbRoutes); //facturas de data base
app.use('/api/facturasmail', facturaMailRoutes); //pedido de facturas al mail
app.use('/api', adminRoutes);
app.use('/api', usuarioRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
