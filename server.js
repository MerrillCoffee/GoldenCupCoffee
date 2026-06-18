import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired session token." });
    req.user = user;
    next();
  });
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password are required." });

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) return res.status(400).json({ error: "Username is already taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, is_admin',
      [username, hashedPassword]
    );

    const token = jwt.sign({ id: newUser.rows[0].id, username: newUser.rows[0].username, is_admin: newUser.rows[0].is_admin }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, username: newUser.rows[0].username });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Internal server error during registration." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid username or password." });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid username or password." });

    const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal server error during login." });
  }
});

// ==========================================
// PERSONAL BREW LOG ROUTES
// ==========================================

app.get('/api/brews', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(`
      SELECT 
        b.id, b.roastery, b.region, b.coffee_amount, b.roast_type, b.brew_method, b.water_temp, b.grind_size, b.created_at, b.is_public, b.is_pinned,
        u.username AS author,
        false AS is_saved_recipe
      FROM brews b
      JOIN users u ON b.user_id = u.id
      WHERE b.user_id = $1
      
      UNION ALL
      
      SELECT 
        b.id, b.roastery, b.region, b.coffee_amount, b.roast_type, b.brew_method, b.water_temp, b.grind_size, b.created_at, b.is_public, b.is_pinned,
        u.username AS author,
        true AS is_saved_recipe
      FROM brews b
      JOIN saved_recipes sr ON b.id = sr.brew_id
      JOIN users u ON b.user_id = u.id
      WHERE sr.user_id = $1
      
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching logs:", err.message);
    res.status(500).json({ error: "Database error while fetching history logs." });
  }
});

app.post('/api/brews', authenticateToken, async (req, res) => {
  const { roastery, region, coffee_amount, roast_type, brew_method, water_temp, grind_size, blurb, is_public } = req.body;

  if (!region || !coffee_amount || !roast_type || !brew_method) {
    return res.status(400).json({ error: "Missing required fields to complete log." });
  }

  try {
    const result = await pool.query(
      'INSERT INTO brews (user_id, roastery, region, coffee_amount, roast_type, brew_method, water_temp, grind_size, blurb, is_public) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.user.id, roastery || 'Unknown Roastery', region, coffee_amount, roast_type, brew_method, water_temp || null, grind_size || null, blurb || null, is_public || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating brew:", err.message);
    res.status(500).json({ error: "Database error while saving your brew log." });
  }
});

app.put('/api/brews/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { roastery, region, roast_type, water_temp, grind_size } = req.body;

  try {
    const result = await pool.query(
      'UPDATE brews SET roastery = $1, region = $2, roast_type = $3, water_temp = $4, grind_size = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [roastery, region, roast_type, water_temp, grind_size, id, req.user.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Brew log not found or unauthorized to edit." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating brew:", err.message);
    res.status(500).json({ error: "Database error while editing log entries." });
  }
});

app.delete('/api/brews/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM brews WHERE id = $1 AND (user_id = $2 OR $3 = true) RETURNING *', 
      [id, req.user.id, req.user.is_admin === true]
    );
    if (result.rowCount === 0) return res.status(403).json({ error: "Unauthorized: You can only delete your own posts." });
    res.json({ message: "Brew log successfully deleted!", deletedLog: result.rows[0] });
  } catch (err) {
    console.error("Error deleting brew:", err.message);
    res.status(500).json({ error: "Database error while deleting log entries." });
  }
});

app.put('/api/brews/:id/share', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { blurb } = req.body;
  try {
    const result = await pool.query('UPDATE brews SET is_public = true, blurb = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [blurb, id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Brew log not found or unauthorized." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error sharing brew:", err.message);
    res.status(500).json({ error: "Database error while sharing log." });
  }
});

// ==========================================
// SOCIAL & COMMUNITY ROUTES
// ==========================================

app.get('/api/social/feed', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const filter = req.query.filter || 'global';
  const limit = 10;
  const offset = (page - 1) * limit;

  let joinClause = '';
  let whereClause = 'b.is_public = true';

  if (filter === 'following') {
    joinClause = 'JOIN follows f ON u.id = f.following_id';
    whereClause += ' AND f.follower_id = $1';
  }

  try {
    const result = await pool.query(`
      SELECT 
        b.id, b.roastery, b.region, b.coffee_amount, b.roast_type, b.brew_method, b.water_temp, b.grind_size, b.is_pinned,
        b.blurb, b.created_at,
        u.username AS author,
        (SELECT COUNT(*) FROM likes WHERE brew_id = b.id) AS like_count,
        (SELECT COUNT(*) FROM comments WHERE brew_id = b.id) AS comment_count,
        EXISTS(SELECT 1 FROM likes WHERE brew_id = b.id AND user_id = $1) AS has_liked,
        EXISTS(SELECT 1 FROM saved_recipes WHERE brew_id = b.id AND user_id = $1) AS has_saved
      FROM brews b
      JOIN users u ON b.user_id = u.id
      ${joinClause}
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching social feed:", err.message);
    res.status(500).json({ error: "Failed to load the community timeline." });
  }
});

app.get('/api/social/users/:username/brews', authenticateToken, async (req, res) => {
  const { username } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(`
      SELECT 
        b.id, b.roastery, b.region, b.coffee_amount, b.roast_type, b.brew_method, b.water_temp, b.grind_size, b.is_pinned,
        b.blurb, b.created_at,
        u.username AS author,
        (SELECT COUNT(*) FROM likes WHERE brew_id = b.id) AS like_count,
        (SELECT COUNT(*) FROM comments WHERE brew_id = b.id) AS comment_count,
        EXISTS(SELECT 1 FROM likes WHERE brew_id = b.id AND user_id = $1) AS has_liked,
        EXISTS(SELECT 1 FROM saved_recipes WHERE brew_id = b.id AND user_id = $1) AS has_saved
      FROM brews b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_public = true AND u.username = $2
      ORDER BY b.is_pinned DESC, b.created_at DESC  /* FIX: Sort by pins first, then date */
      LIMIT $3 OFFSET $4
    `, [req.user.id, username, limit, offset]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user profile:", err.message);
    res.status(500).json({ error: "Failed to load user profile." });
  }
});

// --- Toggle Pin Status ---
app.post('/api/social/brews/:id/pin', authenticateToken, async (req, res) => {
  const brewId = req.params.id;
  const userId = req.user.id;

  try {
    const brewCheck = await pool.query('SELECT is_pinned FROM brews WHERE id = $1 AND user_id = $2', [brewId, userId]);
    
    if (brewCheck.rowCount === 0) return res.status(403).json({ error: "Unauthorized or post not found." });
    
    const isCurrentlyPinned = brewCheck.rows[0].is_pinned;

    if (!isCurrentlyPinned) {
      const pinCount = await pool.query('SELECT COUNT(*) FROM brews WHERE user_id = $1 AND is_pinned = true', [userId]);
      if (parseInt(pinCount.rows[0].count) >= 3) {
        return res.status(400).json({ error: "You can only pin up to 3 brews on your profile." });
      }
    }

    const result = await pool.query(
      'UPDATE brews SET is_pinned = $1 WHERE id = $2 RETURNING is_pinned',
      [!isCurrentlyPinned, brewId]
    );

    res.json({ isPinned: result.rows[0].is_pinned });
  } catch (err) {
    console.error("Error toggling pin:", err.message);
    res.status(500).json({ error: "Server error toggling pin status." });
  }
});

app.post('/api/social/users/:username/follow', authenticateToken, async (req, res) => {
  try {
    const targetUser = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    if (targetUser.rowCount === 0) return res.status(404).json({ error: "User not found" });
    const targetId = targetUser.rows[0].id;

    if (targetId === req.user.id) return res.status(400).json({ error: "Cannot follow yourself" });

    const check = await pool.query('SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, targetId]);

    if (check.rowCount > 0) {
      await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, targetId]);
      res.json({ isFollowing: false });
    } else {
      await pool.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [req.user.id, targetId]);
      res.json({ isFollowing: true });
    }
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Server error toggling follow" });
  }
});

app.get('/api/social/users/:username/is_following', authenticateToken, async (req, res) => {
  try {
    const targetUser = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    if (targetUser.rowCount === 0) return res.json({ isFollowing: false });
    
    const check = await pool.query('SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, targetUser.rows[0].id]);
    res.json({ isFollowing: check.rowCount > 0 });
  } catch (err) {
    res.status(500).json({ error: "Server error checking follow status" });
  }
});

app.post('/api/social/brews/:id/like', authenticateToken, async (req, res) => {
  const brewId = req.params.id;
  const userId = req.user.id;
  try {
    const check = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND brew_id = $2', [userId, brewId]);
    if (check.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = $1 AND brew_id = $2', [userId, brewId]);
    } else {
      await pool.query('INSERT INTO likes (user_id, brew_id) VALUES ($1, $2)', [userId, brewId]);
    }
    const countResult = await pool.query('SELECT COUNT(*) FROM likes WHERE brew_id = $1', [brewId]);
    res.json({ hasLiked: check.rows.length === 0, like_count: countResult.rows[0].count });
  } catch (err) {
    console.error("Error toggling like:", err.message);
    res.status(500).json({ error: "Server error toggling like" });
  }
});

app.post('/api/social/brews/:id/save', authenticateToken, async (req, res) => {
  const brewId = req.params.id;
  const userId = req.user.id;
  try {
    const check = await pool.query('SELECT * FROM saved_recipes WHERE user_id = $1 AND brew_id = $2', [userId, brewId]);
    if (check.rows.length > 0) {
      await pool.query('DELETE FROM saved_recipes WHERE user_id = $1 AND brew_id = $2', [userId, brewId]);
    } else {
      await pool.query('INSERT INTO saved_recipes (user_id, brew_id) VALUES ($1, $2)', [userId, brewId]);
    }
    res.json({ hasSaved: check.rows.length === 0 });
  } catch (err) {
    console.error("Error toggling save:", err.message);
    res.status(500).json({ error: "Server error toggling save" });
  }
});

app.get('/api/social/brews/:id/comments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.comment_text, c.created_at, u.username,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) AS like_count,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2) AS has_liked
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.brew_id = $1 
      ORDER BY c.created_at ASC
    `, [req.params.id, req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

app.post('/api/social/brews/:id/comments', authenticateToken, async (req, res) => {
  const { comment_text } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (user_id, brew_id, comment_text) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, req.params.id, comment_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error posting comment:", err.message);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

app.post('/api/social/comments/:id/like', authenticateToken, async (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;
  try {
    const check = await pool.query('SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
    if (check.rows.length > 0) {
      await pool.query('DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
    } else {
      await pool.query('INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)', [userId, commentId]);
    }
    const countResult = await pool.query('SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1', [commentId]);
    res.json({ hasLiked: check.rows.length === 0, like_count: countResult.rows[0].count });
  } catch (err) {
    console.error("Error toggling comment like:", err.message);
    res.status(500).json({ error: "Server error toggling comment like" });
  }
});

app.delete('/api/social/comments/:id', authenticateToken, async (req, res) => {
  const commentId = req.params.id;
  try {
    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND (user_id = $2 OR $3 = true) RETURNING *', 
      [commentId, req.user.id, req.user.is_admin === true]
    );
    if (result.rowCount === 0) return res.status(403).json({ error: "Unauthorized or comment not found." });
    res.json({ message: "Comment deleted successfully", deletedId: commentId });
  } catch (err) {
    console.error("Error deleting comment:", err.message);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// ==========================================
// PRODUCTION FRONTEND SERVING
// ==========================================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Golden Cup Backend API spinning hot on port ${PORT}`);
});