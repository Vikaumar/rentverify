/**
 * @file db/migrate.js
 * @description Creates the MySQL tables for RentVerify if they don't exist.
 * Run with: node db/migrate.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('[Migrate] Connected to MySQL server.');

  // Create database if not exists
  const dbName = process.env.MYSQL_DATABASE || 'rentverify';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${dbName}\``);
  console.log(`[Migrate] Using database: ${dbName}`);

  // ── Users Table ──────────────────────────────────────────
  await connection.query(`
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_firebase_uid (firebase_uid),
      INDEX idx_users_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[Migrate] ✅ Table `users` ready.');

  // ── Verifications Table ──────────────────────────────────
  await connection.query(`
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_verifications_status (status),
      INDEX idx_verifications_ref_code (ref_code),
      INDEX idx_verifications_submitted_at (submitted_at),
      INDEX idx_verifications_link_token (link_token),
      FULLTEXT INDEX idx_verifications_search (guest_name, guest_phone, ref_code, guest_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[Migrate] ✅ Table `verifications` ready.');

  // ── Audit Events Table ───────────────────────────────────
  await connection.query(`
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_verification_id (verification_id),
      INDEX idx_audit_timestamp (timestamp),
      INDEX idx_audit_compound (verification_id, timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[Migrate] ✅ Table `audit_events` ready.');

  console.log('\n[Migrate] 🎉 All tables created successfully!');
  await connection.end();
}

migrate().catch((err) => {
  console.error('[Migrate] ❌ Migration failed:', err);
  process.exit(1);
});
