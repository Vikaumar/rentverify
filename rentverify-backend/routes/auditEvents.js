/**
 * @file routes/auditEvents.js
 * @description Audit event routes for listing and creating audit trail entries.
 */

const express = require('express');
const { pool } = require('../db/connection');
const { authenticateToken } = require('../middleware/firebaseAuth');

const router = express.Router();

// Helper: convert DB row to API response
function toApiObj(row) {
  return {
    id: row.id,
    verificationId: row.verification_id,
    eventType: row.event_type,
    actor: row.actor,
    description: row.description,
    timestamp: row.timestamp,
    metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
  };
}

// GET /api/audit-events — List with optional verificationId filter
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { verificationId } = req.query;
    let query = 'SELECT * FROM audit_events';
    const params = [];

    if (verificationId) {
      query += ' WHERE verification_id = ?';
      params.push(verificationId);
    }

    query += ' ORDER BY timestamp ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(toApiObj));
  } catch (err) {
    console.error('[API] GET /audit-events error:', err);
    res.status(500).json({ error: 'Failed to fetch audit events' });
  }
});

// POST /api/audit-events — Create new audit event
router.post('/', async (req, res) => {
  try {
    const { id, verificationId, eventType, actor, description, timestamp, metadata } = req.body;

    await pool.query(
      `INSERT INTO audit_events (id, verification_id, event_type, actor, description, timestamp, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, verificationId, eventType, actor, description, timestamp, metadata ? JSON.stringify(metadata) : null]
    );

    res.status(201).json({
      id,
      verificationId,
      eventType,
      actor,
      description,
      timestamp,
      metadata: metadata || null,
    });
  } catch (err) {
    console.error('[API] POST /audit-events error:', err);
    res.status(500).json({ error: 'Failed to create audit event' });
  }
});

module.exports = router;
