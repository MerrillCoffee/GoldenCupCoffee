DROP TABLE IF EXISTS brews;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- do something else other than VARCHAR!!! look into Enumerated!
CREATE TABLE brews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    region VARCHAR(100) NOT NULL,
    coffee_amount VARCHAR(20) NOT NULL,
    roast_type VARCHAR(50) NOT NULL,
    brew_method VARCHAR(50) DEFAULT 'Pour Over',
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password) 
VALUES ('coffee_lover_99', 'supersecretpassword');

INSERT INTO brews (user_id, region, coffee_amount, roast_type, brew_method, is_shared)
VALUES 
(1, 'Colombia', '16 oz', 'Medium', 'Pour Over', false),
(1, 'Ethiopia Yirgacheffe', '12 oz', 'Light', 'Aeropress', true),
(1, 'Sumatra Mandheling', '8 oz', 'Dark', 'French Press', false);