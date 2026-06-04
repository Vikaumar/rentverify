/**
 * @file server.js
 * @description Main Express server entry point for RentVerify Backend.
 * Connects to MySQL, seeds default admin user, and registers all routes.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./db/connection');

// Route imports
const authRoutes = require('./routes/auth');
const verificationRoutes = require('./routes/verifications');
const auditEventRoutes = require('./routes/auditEvents');
const statsRoutes = require('./routes/stats');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Large limit for base64 image data

// ─── Health Check ─────────────────────────────────────────────────
let isConnected = false;

app.get('/api/health', (req, res) => {
  res.json({
    status: isConnected ? 'connected' : 'offline',
    database: isConnected ? 'MySQL' : 'Offline Mode',
    timestamp: new Date().toISOString(),
  });
});

// ─── Route Registration ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/audit-events', auditEventRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', dataRoutes); // /api/seed, /api/sync, /api/export

// ─── Seed Default Admin User ──────────────────────────────────────
async function seedDefaultUser() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM users');
    if (rows[0].cnt === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Vikumar@16', salt);

      await pool.query(
        `INSERT INTO users (username, password_hash, role, name, email, phone, property_name)
         VALUES (?, ?, 'super_admin', ?, ?, ?, ?)`,
        [
          'admin',
          passwordHash,
          'Ramesh Kumar',
          'ramesh.guardian@rentverify.in',
          '+91 98765 43210',
          'Greenwood Heights Apartment 302B',
        ]
      );
      console.log('[Server] 👤 Default super_admin user seeded: admin / Vikumar@16');
    }
  } catch (err) {
    console.error('[Server] Failed to seed default user:', err.message);
  }
}

// ─── Start Server ─────────────────────────────────────────────────
async function start() {
  // Test MySQL connection
  isConnected = await testConnection();

  if (isConnected) {
    console.log('[Server] ✅ Connected to MySQL successfully');

    // Auto-run migration (create tables if not exist)
    try {
      const mysql = require('mysql2/promise');
      const dbName = process.env.MYSQL_DATABASE || 'rentverify';
      const conn = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        multipleStatements: true,
      });

      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await conn.query(`USE \`${dbName}\``);

      // Create tables if not exist
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          firebase_uid VARCHAR(128) DEFAULT NULL UNIQUE,
          username VARCHAR(50) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('super_admin', 'guardian') NOT NULL DEFAULT 'guardian',
          name VARCHAR(100) DEFAULT '',
          email VARCHAR(100) DEFAULT '',
          phone VARCHAR(20) DEFAULT '',
          avatar_url TEXT DEFAULT NULL,
          property_name VARCHAR(200) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS verifications (
          id VARCHAR(32) PRIMARY KEY,
          ref_code VARCHAR(30) NOT NULL UNIQUE,
          status ENUM('pending', 'approved', 'rejected', 'flagged') NOT NULL DEFAULT 'pending',
          guest_name VARCHAR(100) NOT NULL,
          guest_phone VARCHAR(20) NOT NULL,
          guest_email VARCHAR(100) DEFAULT NULL,
          guest_count INT NOT NULL DEFAULT 1,
          purpose VARCHAR(100) NOT NULL,
          booking_platform VARCHAR(50) DEFAULT NULL,
          selfie_data LONGTEXT DEFAULT NULL,
          id_type VARCHAR(30) NOT NULL,
          id_image_data LONGTEXT DEFAULT NULL,
          checkin_date DATE NOT NULL,
          checkin_time TIME NOT NULL,
          checkout_date DATE NOT NULL,
          checkout_time TIME NOT NULL,
          submitted_at DATETIME NOT NULL,
          reviewed_at DATETIME DEFAULT NULL,
          reviewed_by VARCHAR(50) DEFAULT NULL,
          rejection_reason TEXT DEFAULT NULL,
          flag_reason TEXT DEFAULT NULL,
          guardian_note TEXT DEFAULT NULL,
          link_token VARCHAR(64) NOT NULL,
          link_expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS audit_events (
          id VARCHAR(32) PRIMARY KEY,
          verification_id VARCHAR(32) NOT NULL,
          event_type ENUM(
            'link_sent', 'details_submitted', 'selfie_uploaded', 'id_uploaded',
            'submission_complete', 'guardian_viewed', 'approved', 'rejected',
            'flagged', 'sms_sent', 'whatsapp_sent', 'escalation_sent'
          ) NOT NULL,
          actor ENUM('guest', 'guardian', 'system') NOT NULL,
          description TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          metadata JSON DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.end();
      console.log('[Server] ✅ Database tables verified/created');
    } catch (migErr) {
      console.warn('[Server] Auto-migration warning:', migErr.message);
    }

    await seedDefaultUser();
  } else {
    console.error('[Server] ❌ MySQL connection failed — check your .env configuration');
    console.log('[Server] ⚡ Server will start but database operations will fail\n');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 RentVerify API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Mode:   ${isConnected ? '☁️  MySQL Connected' : '💾 Offline (No DB)'}\n`);
  });
}

start();
