// routes/users.js - User registration route
const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/register-user
// Saves Firebase UID + email to MySQL after first login
router.post('/register-user', async (req, res) => {
  const { firebase_uid, email } = req.body;

  if (!firebase_uid || !email) {
    return res.status(400).json({ error: 'firebase_uid and email are required' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = ?',
      [firebase_uid]
    );

    if (existing.length > 0) {
      return res.status(200).json({ message: 'User already registered', userId: existing[0].id });
    }

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (firebase_uid, email) VALUES (?, ?)',
      [firebase_uid, email]
    );

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (err) {
    console.error('Register user error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
