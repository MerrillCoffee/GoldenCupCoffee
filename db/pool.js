import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'maxyf',       
  host: 'localhost',
  database: 'golden_cup',
  password: '1237Kittles@',        
  port: 5432,
});

export default pool;