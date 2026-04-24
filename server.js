const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// PostgreSQL connection config placeholder
// You can set these variables in a .env file later when you connect your database using pgAdmin
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'online_banking',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// Basic route for API checking
app.get('/api/status', async (req, res) => {
  try {
    // A simple query to check if DB is connected (will fail if no DB is running yet, so we catch it)
    // await pool.query('SELECT NOW()'); 
    res.json({ message: 'Welcome to the Online Banking Server! API is running.' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Server running, but database connection failed.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`To view the basic template page, go to http://localhost:${PORT}`);
});
