/**
 * @file routes/stats.js
 * @description Dashboard statistics endpoint using MySQL aggregations.
 */

const express = require('express');
const { pool } = require('../db/connection');
const { authenticateToken } = require('../middleware/firebaseAuth');

const router = express.Router();

// GET /api/stats — Dashboard statistics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString().slice(0, 19).replace('T', ' ');
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().slice(0, 19).replace('T', ' ');

    // Execute all queries in parallel
    const [
      [pendingResult],
      [flaggedResult],
      [approvedTodayResult],
      [totalMonthResult],
      [rejectedMonthResult],
      [avgResponseResult],
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as cnt FROM verifications WHERE status = ?', ['pending']),
      pool.query('SELECT COUNT(*) as cnt FROM verifications WHERE status = ?', ['flagged']),
      pool.query('SELECT COUNT(*) as cnt FROM verifications WHERE status = ? AND reviewed_at >= ?', ['approved', todayStart]),
      pool.query('SELECT COUNT(*) as cnt FROM verifications WHERE reviewed_at >= ?', [monthStart]),
      pool.query('SELECT COUNT(*) as cnt FROM verifications WHERE status = ? AND reviewed_at >= ?', ['rejected', monthStart]),
      pool.query(
        `SELECT AVG(TIMESTAMPDIFF(SECOND, submitted_at, reviewed_at)) * 1000 as avg_ms
         FROM verifications
         WHERE reviewed_at IS NOT NULL AND submitted_at IS NOT NULL AND reviewed_at >= ?`,
        [monthStart]
      ),
    ]);

    res.json({
      pending: pendingResult[0].cnt,
      approvedToday: approvedTodayResult[0].cnt,
      flagged: flaggedResult[0].cnt,
      totalThisMonth: totalMonthResult[0].cnt,
      rejectedThisMonth: rejectedMonthResult[0].cnt,
      avgResponseTimeMs: Math.round(avgResponseResult[0].avg_ms || 0),
    });
  } catch (err) {
    console.error('[API] GET /stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
