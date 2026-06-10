import express from 'express';
import cors from 'cors';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'golden_cup_secret_key_2026';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- PSQL pool ---
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired session token." });
    }
    req.user = user;
    next();
  });
};

// User Reg
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    const token = jwt.sign({ id: newUser.rows[0].id, username: newUser.rows[0].username }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, username: newUser.rows[0].username });

  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Internal server error during registration." });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal server error during login." });
  }
});

// 1. Auths
app.get('/api/brews', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM brews WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching brews:", err.message);
    res.status(500).json({ error: "Database error while fetching history logs." });
  }
});

// 2. Create a new log
app.post('/api/brews', authenticateToken, async (req, res) => {
  const { region, coffee_amount, roast_type, brew_method } = req.body;

  if (!region || !coffee_amount || !roast_type || !brew_method) {
    return res.status(400).json({ error: "Missing required fields to complete log." });
  }

  try {
    const result = await pool.query(
      'INSERT INTO brews (user_id, region, coffee_amount, roast_type, brew_method) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, region, coffee_amount, roast_type, brew_method]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating brew:", err.message);
    res.status(500).json({ error: "Database error while saving your brew log." });
  }
});

// 3. Update specific log
app.put('/api/brews/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { region, roast_type } = req.body;

  try {
    const result = await pool.query(
      'UPDATE brews SET region = $1, roast_type = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [region, roast_type, id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Brew log not found or unauthorized to edit." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating brew:", err.message);
    res.status(500).json({ error: "Database error while editing log entries." });
  }
});

// 4. Delete specific logs
app.delete('/api/brews/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM brews WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Brew log not found or unauthorized to delete." });
    }

    res.json({ message: "Brew log successfully deleted from records!", deletedLog: result.rows[0] });
  } catch (err) {
    console.error("Error deleting brew:", err.message);
    res.status(500).json({ error: "Database error while deleting log entries." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Golden Cup Backend API spinning hot on port ${PORT}`);
});