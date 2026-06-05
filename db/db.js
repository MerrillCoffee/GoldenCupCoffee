import pool from './pool.js';

export async function findUserByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0];
}

export async function createUser(username, hashedPassword) {
  const text = 'INSERT INTO users(username, password) VALUES($1, $2) RETURNING id, username, created_at';
  const { rows } = await pool.query(text, [username, hashedPassword]);
  return rows[0];
}

// Only pull brews belonging to the logged-in user's ID
export async function getAllBrews(userId) {
  const text = 'SELECT * FROM brews WHERE user_id = $1 ORDER BY created_at DESC';
  const { rows } = await pool.query(text, [userId]);
  return rows;
}

// Ensure the new brew record explicitly saves who made it
export async function createBrew(userId, region, coffee_amount, roast_type, brew_method) {
  const text = 'INSERT INTO brews(user_id, region, coffee_amount, roast_type, brew_method) VALUES($1, $2, $3, $4, $5) RETURNING *';
  const values = [userId, region, coffee_amount, roast_type, brew_method];
  const { rows } = await pool.query(text, values);
  return rows[0];
}