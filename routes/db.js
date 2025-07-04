// db.js
const { Pool } = require('pg');

const db = new Pool({
  user: 'tributoadmin',
  host: 'dpg-d1f9rd9r0fns73ckhn40-a.virginia-postgres.render.com',
  database: 'dbtributo',
  password: 'PcSID3lDaYrq65MmC8dGJ4Ok3e6O5Q3M',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = db;
