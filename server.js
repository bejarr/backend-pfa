require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'auth.db');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Users table initialized');
    }
  });
}

// VULNERABLE ENDPOINT: SQL Injection in login
// WARNING: This endpoint intentionally contains a SQL injection vulnerability for testing
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // VULNERABLE CODE - DO NOT USE IN PRODUCTION
  // The query directly concatenates user input without parameterization
  // This allows SQL injection attacks
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  console.log('[VULNERABLE] SQL Query:', query); // Log for testing visibility

  db.get(query, (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  });
});

// VULNERABLE ENDPOINT: SQL Injection in user search
// This allows attackers to extract database information
app.get('/api/auth/search', (req, res) => {
  const { search } = req.query;

  // VULNERABLE CODE - Direct concatenation without parameterization
  const query = `SELECT id, username, email FROM users WHERE username LIKE '%${search}%' OR email LIKE '%${search}%'`;

  console.log('[VULNERABLE] SQL Query:', query);

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      success: true,
      users: rows || []
    });
  });
});

// SECURE ENDPOINT: Safe registration with parameterized queries
app.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // SECURE: Using parameterized query
  const query = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';

  db.run(query, [username, password, email], function(err) {
    if (err) {
      console.error('Registration error:', err.message);
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: this.lastID
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', db: 'SQLite' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Vulnerable Auth Backend running on http://localhost:${PORT}`);
  console.log('⚠️  WARNING: This server contains intentional vulnerabilities for testing');
  console.log('Vulnerable endpoints:');
  console.log('- POST /api/auth/login (SQL Injection)');
  console.log('- GET /api/auth/search (SQL Injection)');
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error(err);
    console.log('Database connection closed');
    process.exit(0);
  });
});
