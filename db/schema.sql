CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    region VARCHAR(100),
    roast_type VARCHAR(50),
    coffee_amount VARCHAR(20),
    brew_method VARCHAR(50) DEFAULT 'Pour Over',
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);