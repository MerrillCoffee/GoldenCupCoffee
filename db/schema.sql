DROP TABLE IF EXISTS saved_recipes CASCADE;
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS brews CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS roast_level CASCADE;
DROP TYPE IF EXISTS brew_style CASCADE;

-- Create the Enumerated Types
CREATE TYPE roast_level AS ENUM ('Light', 'Medium', 'Dark');
CREATE TYPE brew_style AS ENUM ('Drip Brew', 'Pour Over', 'Espresso', 'French Press', 'Aeropress', 'Percolator', 'Cold Brew');

-- Core Tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    roastery VARCHAR(100) DEFAULT 'Unknown Roastery', -- NEW COLUMN
    region VARCHAR(100) NOT NULL,
    coffee_amount VARCHAR(20) NOT NULL,
    roast_type roast_level NOT NULL,
    brew_method brew_style DEFAULT 'Pour Over',
    blurb TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social Tracking Tables
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  brew_id INTEGER REFERENCES brews(id) ON DELETE CASCADE,
  UNIQUE(user_id, brew_id) 
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  brew_id INTEGER REFERENCES brews(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comment_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  UNIQUE(user_id, comment_id)
);

CREATE TABLE saved_recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  brew_id INTEGER REFERENCES brews(id) ON DELETE CASCADE,
  UNIQUE(user_id, brew_id)
);

-- Seed Data (Updated with Roasteries)
INSERT INTO users (username, password) 
VALUES ('coffee_lover_99', 'supersecretpassword');

INSERT INTO brews (user_id, roastery, region, coffee_amount, roast_type, brew_method, blurb, is_public)
VALUES 
(1, 'Onyx Coffee Lab', 'Colombia', '16 oz', 'Medium', 'Pour Over', 'Trying out a slightly coarser grind today. The acidity is popping!', true),
(1, 'Verve Coffee', 'Ethiopia Yirgacheffe', '12 oz', 'Light', 'Aeropress', 'Standard James Hoffmann method. Tastes like blueberries.', true),
(1, 'Local Cafe', 'Sumatra Mandheling', '8 oz', 'Dark', 'French Press', 'A classic heavy hitter for a rainy morning.', true);