import express, { json } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAllBrews, createBrew, findUserByUsername, createUser } from './db/db.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'super_secret_coffee_key_123';

app.use(json());

// --- middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied. Token missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = user;
    next();
  });
}

// --- user auth routes ---

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await findUserByUsername(username);
    if (existingUser) return res.status(400).json({ error: "Username already taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(username, hashedPassword);
    res.status(201).json({ message: "Registration successful!", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server registration failed." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await findUserByUsername(username);
    if (!user) return res.status(400).json({ error: "Invalid credentials." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials." });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: "Logged in successfully!", token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server login error." });
  }
});

// --- brew  routes ---

app.get('/api/brews', authenticateToken, async (req, res) => {
  try {
    const brews = await getAllBrews(req.user.id); 
    res.json(brews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch personal brews." });
  }
});

app.post('/api/brews', authenticateToken, async (req, res) => {
  const { region, coffee_amount, roast_type, brew_method } = req.body;
  try {
    const newBrew = await createBrew(req.user.id, region, coffee_amount, roast_type, brew_method);
    res.status(201).json(newBrew);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save personal brew log." });
  }
});

app.listen(PORT, () => {
  console.log(`Authenticated Server streaming at http://localhost:${PORT}`);
});