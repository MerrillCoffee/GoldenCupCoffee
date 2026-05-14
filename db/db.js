const pool = require('./pool');

const db = {
  getAllBrews: async () => {
    const { rows } = await pool.query('SELECT * FROM brews ORDER BY created_at DESC');
    return rows;
  },

  createBrew: async (region, coffee_amount, roast_type) => {
    const text = 'INSERT INTO brews(region, coffee_amount, roast_type) VALUES($1, $2, $3) RETURNING *';
    const values = [region, coffee_amount, roast_type];
    const { rows } = await pool.query(text, values);
    return rows[0];
  }
};

module.exports = db;