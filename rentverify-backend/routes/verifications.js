/**
 * @file routes/verifications.js
 * @description CRUD routes for guest verifications using MySQL.
 * Includes public guest endpoints (by-token) and authenticated admin endpoints.
 */

const express = require('express');
const crypto = require('crypto');
const os = require('os');
const { pool } = require('../db/connection');
const { authenticateToken } = require('../middleware/firebaseAuth');
const notificationService = require('../services/notificationService');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return 'localhost';
}

function getFrontendHost(req) {
  const host = req.headers.host || 'localhost:3001';
  let frontendHost = host.replace('3001', '5173');
  if (frontendHost.includes('localhost') || frontendHost.includes('127.0.0.1')) {
    const localIp = getLocalIpAddress();
    frontendHost = frontendHost.replace('localhost', localIp).replace('127.0.0.1', localIp);
  }
  return frontendHost;
}

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

// Helper: convert camelCase verification object to snake_case for DB insert/update
function toDbRow(v) {
  return {
    id: v.id,
    ref_code: v.refCode,
    status: v.status,
    guest_name: v.guestName,
    guest_phone: v.guestPhone,
    guest_email: v.guestEmail || null,
    guest_count: v.guestCount || 1,
    purpose: v.purpose,
    booking_platform: v.bookingPlatform || null,
    selfie_data: v.selfieData || null,
    id_type: v.idType,
    id_image_data: v.idImageData || null,
    checkin_date: v.checkinDate,
    checkin_time: v.checkinTime,
    checkout_date: v.checkoutDate,
    checkout_time: v.checkoutTime,
    submitted_at: v.submittedAt,
    reviewed_at: v.reviewedAt || null,
    reviewed_by: v.reviewedBy || null,
    rejection_reason: v.rejectionReason || null,
    flag_reason: v.flagReason || null,
    guardian_note: v.guardianNote || null,
    link_token: v.linkToken,
    link_expires_at: v.linkExpiresAt,
  };
}

// Helper: convert snake_case DB row to camelCase API response
function toApiObj(row) {
  return {
    id: row.id,
    refCode: row.ref_code,
    status: row.status,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    guestEmail: row.guest_email,
    guestCount: row.guest_count,
    purpose: row.purpose,
    bookingPlatform: row.booking_platform,
    selfieData: row.selfie_data,
    idType: row.id_type,
    idImageData: row.id_image_data,
    checkinDate: row.checkin_date,
    checkinTime: row.checkin_time,
    checkoutDate: row.checkout_date,
    checkoutTime: row.checkout_time,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
    flagReason: row.flag_reason,
    guardianNote: row.guardian_note,
    linkToken: row.link_token,
    linkExpiresAt: row.link_expires_at,
  };
}

// ─── Public Guest Routes (no auth required) ───────────────────────

// GET /api/verifications/by-token/:token
router.get('/by-token/:token', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM verifications WHERE link_token = ?',
      [req.params.token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Verification link invalid or not found' });
    }

    const row = rows[0];

    // Check expiration
    if (new Date(row.link_expires_at).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Verification link has expired. Please contact the property host.' });
    }

    res.json(toApiObj(row));
  } catch (err) {
    console.error('[API] GET /verifications/by-token error:', err);
    res.status(500).json({ error: 'Failed to look up verification link' });
  }
});

// PUT /api/verifications/by-token/:token — Guest submits photos
router.put('/by-token/:token', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM verifications WHERE link_token = ?',
      [req.params.token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Verification link invalid or not found' });
    }

    const existing = rows[0];

    if (new Date(existing.link_expires_at).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Verification link has expired.' });
    }

    const { selfieData, idImageData, idType } = req.body;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      `UPDATE verifications SET
        selfie_data = COALESCE(?, selfie_data),
        id_image_data = COALESCE(?, id_image_data),
        id_type = COALESCE(?, id_type),
        status = 'pending',
        submitted_at = ?
      WHERE link_token = ?`,
      [selfieData || null, idImageData || null, idType || null, now, req.params.token]
    );

    // Insert audit events
    const auditEvents = [
      { id: 'ev-sub-' + generateId(), verification_id: existing.id, event_type: 'details_submitted', actor: 'guest', description: `Guest details submitted: ${existing.guest_name}`, timestamp: now, metadata: null },
      { id: 'ev-slf-' + generateId(), verification_id: existing.id, event_type: 'selfie_uploaded', actor: 'guest', description: 'Selfie photo successfully uploaded', timestamp: now, metadata: null },
      { id: 'ev-id-' + generateId(), verification_id: existing.id, event_type: 'id_uploaded', actor: 'guest', description: `Government ID uploaded (${idType || existing.id_type})`, timestamp: now, metadata: null },
      { id: 'ev-cmp-' + generateId(), verification_id: existing.id, event_type: 'submission_complete', actor: 'guest', description: 'Verification submission completed by guest', timestamp: now, metadata: null },
    ];

    for (const evt of auditEvents) {
      await pool.query(
        `INSERT INTO audit_events (id, verification_id, event_type, actor, description, timestamp, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [evt.id, evt.verification_id, evt.event_type, evt.actor, evt.description, evt.timestamp, evt.metadata ? JSON.stringify(evt.metadata) : null]
      );
    }

    // Send notifications
    const frontendHost = getFrontendHost(req);
    const reviewLink = `http://${frontendHost}/`;
    const smsBody = `[Guardian Alert] ${existing.guest_name} has completed their check-in verification (Ref: ${existing.ref_code}). Please review at ${reviewLink}`;

    const adminEmail = notificationService.ADMIN_ALERT_EMAIL || process.env.SMTP_USER || 'admin@propertyguardian.com';
    const emailHtml = notificationService.getAdminAlertTemplate(existing.guest_name, existing.ref_code, reviewLink);

    notificationService.sendEmail(adminEmail, `Guest Verification Completed — Review Pending: ${existing.guest_name}`, emailHtml, smsBody);
    notificationService.sendSMS(existing.guest_phone, smsBody);
    notificationService.sendWhatsApp(existing.guest_phone, smsBody);

    // Return updated record
    const [updated] = await pool.query('SELECT * FROM verifications WHERE link_token = ?', [req.params.token]);
    res.json(toApiObj(updated[0]));
  } catch (err) {
    console.error('[API] PUT /verifications/by-token error:', err);
    res.status(500).json({ error: 'Failed to submit verification details' });
  }
});

// ─── Authenticated Admin Routes ───────────────────────────────────

// GET /api/verifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search, fromDate, toDate, sort } = req.query;
    let query = 'SELECT * FROM verifications WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (guest_name LIKE ? OR guest_phone LIKE ? OR ref_code LIKE ? OR guest_email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (fromDate) {
      query += ' AND submitted_at >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      query += ' AND submitted_at <= ?';
      params.push(toDate);
    }

    // Sort
    if (sort === 'oldest') {
      query += ' ORDER BY submitted_at ASC';
    } else if (sort === 'urgency') {
      query += ' ORDER BY FIELD(status, "pending", "flagged", "approved", "rejected"), submitted_at ASC';
    } else {
      query += ' ORDER BY submitted_at DESC';
    }

    const [rows] = await pool.query(query, params);
    res.json(rows.map(toApiObj));
  } catch (err) {
    console.error('[API] GET /verifications error:', err);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

// GET /api/verifications/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM verifications WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Verification not found' });
    res.json(toApiObj(rows[0]));
  } catch (err) {
    console.error('[API] GET /verifications/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch verification' });
  }
});

// POST /api/verifications — Create new (admin invites guest)
router.post('/', async (req, res) => {
  try {
    const dbRow = toDbRow(req.body);

    await pool.query(
      `INSERT INTO verifications (id, ref_code, status, guest_name, guest_phone, guest_email,
        guest_count, purpose, booking_platform, selfie_data, id_type, id_image_data,
        checkin_date, checkin_time, checkout_date, checkout_time, submitted_at,
        reviewed_at, reviewed_by, rejection_reason, flag_reason, guardian_note,
        link_token, link_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dbRow.id, dbRow.ref_code, dbRow.status, dbRow.guest_name, dbRow.guest_phone,
        dbRow.guest_email, dbRow.guest_count, dbRow.purpose, dbRow.booking_platform,
        dbRow.selfie_data, dbRow.id_type, dbRow.id_image_data, dbRow.checkin_date,
        dbRow.checkin_time, dbRow.checkout_date, dbRow.checkout_time, dbRow.submitted_at,
        dbRow.reviewed_at, dbRow.reviewed_by, dbRow.rejection_reason, dbRow.flag_reason,
        dbRow.guardian_note, dbRow.link_token, dbRow.link_expires_at,
      ]
    );

    // Send guest invitation notifications
    const frontendHost = getFrontendHost(req);
    const secureLink = `http://${frontendHost}/?token=${dbRow.link_token}`;
    const smsBody = `Dear ${dbRow.guest_name}, your host has invited you to complete your secure check-in verification. Please submit your details here: ${secureLink}`;
    const emailHtml = notificationService.getInviteTemplate(dbRow.guest_name, dbRow.checkin_date, dbRow.checkout_date, secureLink);

    notificationService.sendEmail(dbRow.guest_email, 'Stay Verification Invitation — Action Required', emailHtml, smsBody);
    notificationService.sendSMS(dbRow.guest_phone, smsBody);
    notificationService.sendWhatsApp(dbRow.guest_phone, smsBody);

    res.status(201).json(toApiObj(dbRow));
  } catch (err) {
    console.error('[API] POST /verifications error:', err);
    res.status(500).json({ error: 'Failed to create verification' });
  }
});

// PUT /api/verifications/:id — Update (admin decision)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Build dynamic SET clause
    const allowedFields = {
      status: 'status', guestName: 'guest_name', guestPhone: 'guest_phone',
      guestEmail: 'guest_email', guestCount: 'guest_count', purpose: 'purpose',
      bookingPlatform: 'booking_platform', selfieData: 'selfie_data',
      idType: 'id_type', idImageData: 'id_image_data', checkinDate: 'checkin_date',
      checkinTime: 'checkin_time', checkoutDate: 'checkout_date', checkoutTime: 'checkout_time',
      submittedAt: 'submitted_at', reviewedAt: 'reviewed_at', reviewedBy: 'reviewed_by',
      rejectionReason: 'rejection_reason', flagReason: 'flag_reason',
      guardianNote: 'guardian_note', refCode: 'ref_code',
      linkToken: 'link_token', linkExpiresAt: 'link_expires_at',
    };

    const setClauses = [];
    const values = [];

    for (const [camelKey, snakeKey] of Object.entries(allowedFields)) {
      if (req.body[camelKey] !== undefined) {
        setClauses.push(`${snakeKey} = ?`);
        values.push(req.body[camelKey]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE verifications SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated record
    const [rows] = await pool.query('SELECT * FROM verifications WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Verification not found' });

    const verification = rows[0];
    const apiObj = toApiObj(verification);

    // Send guest notifications on status change
    if (req.body.status) {
      const frontendHost = getFrontendHost(req);
      const secureLink = `http://${frontendHost}/?token=${verification.link_token}`;

      if (verification.status === 'approved') {
        const smsBody = `Dear ${verification.guest_name}, your check-in verification has been successfully APPROVED! We look forward to welcoming you on ${verification.checkin_date}.`;
        const emailHtml = notificationService.getDecisionTemplate(verification.guest_name, true, null, secureLink);
        notificationService.sendEmail(verification.guest_email, 'Check-in Verification Approved! Welcome', emailHtml, smsBody);
        notificationService.sendSMS(verification.guest_phone, smsBody);
        notificationService.sendWhatsApp(verification.guest_phone, smsBody);
      } else if (verification.status === 'rejected') {
        const reason = verification.rejection_reason || 'Incomplete details';
        const smsBody = `Dear ${verification.guest_name}, your check-in verification could not be approved. Reason: ${reason}. Please re-submit here: ${secureLink}`;
        const emailHtml = notificationService.getDecisionTemplate(verification.guest_name, false, reason, secureLink);
        notificationService.sendEmail(verification.guest_email, 'Check-in Verification Incomplete — Action Required', emailHtml, smsBody);
        notificationService.sendSMS(verification.guest_phone, smsBody);
        notificationService.sendWhatsApp(verification.guest_phone, smsBody);
      } else if (verification.status === 'flagged') {
        const smsBody = `Dear ${verification.guest_name}, your check-in verification is placed on review hold. We will contact you shortly for additional details.`;
        notificationService.sendSMS(verification.guest_phone, smsBody);
        notificationService.sendWhatsApp(verification.guest_phone, smsBody);
      }
    }

    res.json(apiObj);
  } catch (err) {
    console.error('[API] PUT /verifications/:id error:', err);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

module.exports = router;
