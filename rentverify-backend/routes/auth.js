/**
 * @file routes/auth.js
 * @description Authentication routes: login, profile get/update.
 * Supports both Firebase Auth and local username/password.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const { authenticateToken, JWT_SECRET } = require('../middleware/firebaseAuth');

const router = express.Router();

// ─── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password, firebaseIdToken } = req.body;

    // ── Firebase Token Login ──────────────────────────────
    if (firebaseIdToken) {
      try {
        const admin = require('firebase-admin');
        const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
        const firebaseUid = decoded.uid;

        // Look up or create user by firebase_uid
        const [rows] = await pool.query(
          'SELECT * FROM users WHERE firebase_uid = ?',
          [firebaseUid]
        );

        let user;
        if (rows.length === 0) {
          // Auto-create user from Firebase profile
          const newUsername = (decoded.email || `user_${firebaseUid}`).toLowerCase().trim();
          const dummyHash = await bcrypt.hash(firebaseUid, 10);
          await pool.query(
            `INSERT INTO users (firebase_uid, username, password_hash, role, name, email)
             VALUES (?, ?, ?, 'guardian', ?, ?)`,
            [firebaseUid, newUsername, dummyHash, decoded.name || '', decoded.email || '']
          );
          const [newRows] = await pool.query('SELECT * FROM users WHERE firebase_uid = ?', [firebaseUid]);
          user = newRows[0];
        } else {
          user = rows[0];
        }

        // Issue local JWT for API use
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role, firebaseUid },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: {
            username: user.username,
            role: user.role,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            avatarUrl: user.avatar_url || '',
            propertyName: user.property_name || '',
          },
        });
      } catch (fbErr) {
        console.error('[Auth] Firebase token verification failed:', fbErr.message);
        return res.status(401).json({ error: 'Invalid Firebase token' });
      }
    }

    // ── Username/Password Login ───────────────────────────
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const normUsername = username.toLowerCase().trim();
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [normUsername]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatarUrl: user.avatar_url || '',
        propertyName: user.property_name || '',
      },
    });
  } catch (err) {
    console.error('[API] POST /auth/login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ─── GET /api/auth/profile ────────────────────────────────────────
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.firebaseUid;
    let query, params;

    if (req.user.firebaseUid) {
      query = 'SELECT * FROM users WHERE firebase_uid = ?';
      params = [req.user.firebaseUid];
    } else {
      query = 'SELECT * FROM users WHERE id = ?';
      params = [userId];
    }

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      username: user.username,
      role: user.role,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatarUrl: user.avatar_url || '',
      propertyName: user.property_name || '',
    });
  } catch (err) {
    console.error('[API] GET /auth/profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, avatarUrl, propertyName } = req.body;
    const userId = req.user.id || req.user.firebaseUid;
    let query, params;

    if (req.user.firebaseUid) {
      query = `UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email),
               phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url),
               property_name = COALESCE(?, property_name) WHERE firebase_uid = ?`;
      params = [name, email, phone, avatarUrl, propertyName, req.user.firebaseUid];
    } else {
      query = `UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email),
               phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url),
               property_name = COALESCE(?, property_name) WHERE id = ?`;
      params = [name, email, phone, avatarUrl, propertyName, userId];
    }

    await pool.query(query, params);

    // Fetch updated user
    const fetchQuery = req.user.firebaseUid
      ? 'SELECT * FROM users WHERE firebase_uid = ?'
      : 'SELECT * FROM users WHERE id = ?';
    const fetchParam = req.user.firebaseUid || userId;
    const [rows] = await pool.query(fetchQuery, [fetchParam]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      username: user.username,
      role: user.role,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatarUrl: user.avatar_url || '',
      propertyName: user.property_name || '',
    });
  } catch (err) {
    console.error('[API] PUT /auth/profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
