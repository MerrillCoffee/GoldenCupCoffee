const { Pool } = require('pg');

const pool = new Pool({
  user: 'maxyf', 
  host: 'localhost',
  database: 'golden_cup',
  password: 'your_password',
  port: 5432,
});

module.exports = pool;