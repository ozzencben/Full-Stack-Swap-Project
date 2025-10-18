require('dotenv').config();
const pkg = require('pg');

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(() => console.log('Connected to Database'))
  .catch((err) => console.log(err));

module.exports = { pool };
