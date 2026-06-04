/**
 * @file routes/data.js
 * @description Data management routes: seed, sync, and export.
 */

const express = require('express');
const { pool } = require('../db/connection');
const { authenticateToken } = require('../middleware/firebaseAuth');

const router = express.Router();

// POST /api/seed — Seed the database with sample data
router.post('/seed', authenticateToken, async (req, res) => {
  try {
    const { verifications, auditEvents } = req.body;

    // Clear existing data
    await pool.query('DELETE FROM audit_events');
    await pool.query('DELETE FROM verifications');

    // Insert verifications
    if (verifications && verifications.length > 0) {
      for (const v of verifications) {
        await pool.query(
          `INSERT INTO verifications (id, ref_code, status, guest_name, guest_phone, guest_email,
            guest_count, purpose, booking_platform, selfie_data, id_type, id_image_data,
            checkin_date, checkin_time, checkout_date, checkout_time, submitted_at,
            reviewed_at, reviewed_by, rejection_reason, flag_reason, guardian_note,
            link_token, link_expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            v.id, v.refCode, v.status, v.guestName, v.guestPhone, v.guestEmail || null,
            v.guestCount || 1, v.purpose, v.bookingPlatform || null, v.selfieData || null,
            v.idType, v.idImageData || null, v.checkinDate, v.checkinTime,
            v.checkoutDate, v.checkoutTime, v.submittedAt, v.reviewedAt || null,
            v.reviewedBy || null, v.rejectionReason || null, v.flagReason || null,
            v.guardianNote || null, v.linkToken, v.linkExpiresAt,
          ]
        );
      }
    }

    // Insert audit events
    if (auditEvents && auditEvents.length > 0) {
      for (const e of auditEvents) {
        await pool.query(
          `INSERT INTO audit_events (id, verification_id, event_type, actor, description, timestamp, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [e.id, e.verificationId, e.eventType, e.actor, e.description, e.timestamp, e.metadata ? JSON.stringify(e.metadata) : null]
        );
      }
    }

    res.json({
      success: true,
      inserted: {
        verifications: verifications?.length || 0,
        auditEvents: auditEvents?.length || 0,
      },
    });
  } catch (err) {
    console.error('[API] POST /seed error:', err);
    res.status(500).json({ error: 'Failed to seed data' });
  }
});

// POST /api/sync — Upsert data (offline-to-online sync)
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { verifications, auditEvents } = req.body;
    const results = { verifications: 0, auditEvents: 0 };

    if (verifications && verifications.length > 0) {
      for (const v of verifications) {
        const [existing] = await pool.query('SELECT id FROM verifications WHERE id = ?', [v.id]);
        if (existing.length > 0) {
          // Update
          const setClauses = [];
          const values = [];
          const fields = {
            status: v.status, guest_name: v.guestName, guest_phone: v.guestPhone,
            guest_email: v.guestEmail, guest_count: v.guestCount, purpose: v.purpose,
            booking_platform: v.bookingPlatform, selfie_data: v.selfieData,
            id_type: v.idType, id_image_data: v.idImageData,
            reviewed_at: v.reviewedAt, reviewed_by: v.reviewedBy,
            rejection_reason: v.rejectionReason, flag_reason: v.flagReason,
            guardian_note: v.guardianNote,
          };
          for (const [key, val] of Object.entries(fields)) {
            if (val !== undefined) {
              setClauses.push(`${key} = ?`);
              values.push(val);
            }
          }
          if (setClauses.length > 0) {
            values.push(v.id);
            await pool.query(`UPDATE verifications SET ${setClauses.join(', ')} WHERE id = ?`, values);
            results.verifications++;
          }
        } else {
          // Insert
          await pool.query(
            `INSERT INTO verifications (id, ref_code, status, guest_name, guest_phone, guest_email,
              guest_count, purpose, booking_platform, selfie_data, id_type, id_image_data,
              checkin_date, checkin_time, checkout_date, checkout_time, submitted_at,
              reviewed_at, reviewed_by, rejection_reason, flag_reason, guardian_note,
              link_token, link_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              v.id, v.refCode, v.status, v.guestName, v.guestPhone, v.guestEmail || null,
              v.guestCount || 1, v.purpose, v.bookingPlatform || null, v.selfieData || null,
              v.idType, v.idImageData || null, v.checkinDate, v.checkinTime,
              v.checkoutDate, v.checkoutTime, v.submittedAt, v.reviewedAt || null,
              v.reviewedBy || null, v.rejectionReason || null, v.flagReason || null,
              v.guardianNote || null, v.linkToken, v.linkExpiresAt,
            ]
          );
          results.verifications++;
        }
      }
    }

    if (auditEvents && auditEvents.length > 0) {
      for (const e of auditEvents) {
        await pool.query(
          `INSERT IGNORE INTO audit_events (id, verification_id, event_type, actor, description, timestamp, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [e.id, e.verificationId, e.eventType, e.actor, e.description, e.timestamp, e.metadata ? JSON.stringify(e.metadata) : null]
        );
        results.auditEvents++;
      }
    }

    res.json({ success: true, synced: results });
  } catch (err) {
    console.error('[API] POST /sync error:', err);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// GET /api/export — Export all data
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const [verifications] = await pool.query('SELECT * FROM verifications');
    const [auditEvents] = await pool.query('SELECT * FROM audit_events');

    // Convert to camelCase
    const toVerificationApi = (row) => ({
      id: row.id, refCode: row.ref_code, status: row.status,
      guestName: row.guest_name, guestPhone: row.guest_phone, guestEmail: row.guest_email,
      guestCount: row.guest_count, purpose: row.purpose, bookingPlatform: row.booking_platform,
      selfieData: row.selfie_data, idType: row.id_type, idImageData: row.id_image_data,
      checkinDate: row.checkin_date, checkinTime: row.checkin_time,
      checkoutDate: row.checkout_date, checkoutTime: row.checkout_time,
      submittedAt: row.submitted_at, reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by, rejectionReason: row.rejection_reason,
      flagReason: row.flag_reason, guardianNote: row.guardian_note,
      linkToken: row.link_token, linkExpiresAt: row.link_expires_at,
    });

    const toAuditApi = (row) => ({
      id: row.id, verificationId: row.verification_id,
      eventType: row.event_type, actor: row.actor,
      description: row.description, timestamp: row.timestamp,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
    });

    res.json({
      exportedAt: new Date().toISOString(),
      verifications: verifications.map(toVerificationApi),
      auditEvents: auditEvents.map(toAuditApi),
    });
  } catch (err) {
    console.error('[API] GET /export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;
