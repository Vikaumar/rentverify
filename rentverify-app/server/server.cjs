/**
 * @file server.js
 * @description Express API server bridging the React frontend to MongoDB Atlas.
 * Provides REST endpoints for verifications and audit events.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Verification = require('./models/Verification.cjs');
const AuditEvent = require('./models/AuditEvent.cjs');
const User = require('./models/User.cjs');
const notificationService = require('./services/notificationService.cjs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'rentverify_secret_secure_key_12345';

const os = require('os');

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

// ─── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Large limit for base64 image data

// ─── MongoDB Connection ───────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI.includes('your_username')) {
  console.error('\n╔═══════════════════════════════════════════════════════╗');
  console.error('║  ⚠️  MongoDB Atlas connection string not configured!  ║');
  console.error('║                                                       ║');
  console.error('║  1. Create a free account at mongodb.com/atlas        ║');
  console.error('║  2. Create a free M0 cluster                          ║');
  console.error('║  3. Get your connection string                        ║');
  console.error('║  4. Update .env file with your MONGODB_URI            ║');
  console.error('╚═══════════════════════════════════════════════════════╝\n');
  console.log('⚡ Starting in OFFLINE MODE — using in-memory storage as fallback...\n');
}

let isConnected = false;

async function seedDefaultUser() {
  try {
    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Vikumar@16', salt);
      const defaultUser = new User({
        username: 'admin',
        passwordHash,
        role: 'super_admin',
      });
      await defaultUser.save();
      console.log('[Server] 👤 Default super_admin user seeded successfully: admin / Vikumar@16');
    }
  } catch (err) {
    console.error('[Server] Failed to seed default user:', err.message);
  }
}

async function connectDB() {
  if (!MONGODB_URI || MONGODB_URI.includes('your_username')) {
    console.log('[Server] No valid MongoDB URI — running in offline/demo mode');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('[Server] ✅ Connected to MongoDB Atlas successfully');
    await seedDefaultUser();
  } catch (err) {
    console.error('[Server] ❌ MongoDB connection failed:', err.message);
    console.log('[Server] Running in offline/demo mode');
  }
}

// ─── Authentication Middleware ────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token' });
    }
    req.user = decoded;
    next();
  });
}

// ─── Authentication Routes ────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const normUsername = username.toLowerCase().trim();

    // If connected to MongoDB, authenticate via User collection
    if (isConnected) {
      const user = await User.findOne({ username: normUsername });
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
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
          avatarUrl: user.avatarUrl || '',
          propertyName: user.propertyName || ''
        }
      });
    } else {
      // Offline fallback login check (to allow demo to work seamlessly)
      if (normUsername === 'admin' && password === 'Vikumar@16') {
        const token = jwt.sign(
          { id: 'offline-admin-id', username: 'admin', role: 'super_admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          token,
          user: {
            username: 'admin',
            role: 'super_admin',
            name: 'Ramesh Kumar',
            email: 'ramesh.guardian@rentverify.in',
            phone: '+91 98765 43210',
            avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_mxd2hKaK4VvUDRS51r4z3ZNiQ2C1eRzIK_W2adwv88lVe5yUNzynVvPVQkOvk4mHpn1koVRQuTTm_BmIBlQoVN4n6CbNYs0jE5eFcmzBxp6zamshohtAbFjqCNrM9nbCdLn1Ek1NyPQUtmNmSN5U3rD9joRoJQCFaYNWbfQsL7cGFFfro7Oc5K45fHXtvW7FIqmUbaQMdJp603D4xeuze7Ij32OOO_vYCBGlexzGGi6FyyyYSXvArDtePWcItKuWM5hr1MjGfnbs',
            propertyName: 'Greenwood Heights Apartment 302B'
          }
        });
      }
      return res.status(401).json({ error: 'Invalid username or password (offline)' });
    }
  } catch (err) {
    console.error('[API] POST /auth/login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// PUT /api/auth/profile — Update active user profile details
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, avatarUrl, propertyName } = req.body;
    
    if (isConnected) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.name = name !== undefined ? name : user.name;
      user.email = email !== undefined ? email : user.email;
      user.phone = phone !== undefined ? phone : user.phone;
      user.avatarUrl = avatarUrl !== undefined ? avatarUrl : user.avatarUrl;
      user.propertyName = propertyName !== undefined ? propertyName : user.propertyName;

      const updated = await user.save();
      return res.json({
        username: updated.username,
        role: updated.role,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl,
        propertyName: updated.propertyName,
      });
    } else {
      // Offline fallback success
      return res.json({
        username: req.user.username,
        role: req.user.role,
        name: name || '',
        email: email || '',
        phone: phone || '',
        avatarUrl: avatarUrl || '',
        propertyName: propertyName || '',
      });
    }
  } catch (err) {
    console.error('[API] PUT /auth/profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/auth/profile — Retrieve active user profile details
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    if (isConnected) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        username: user.username,
        role: user.role,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
        propertyName: user.propertyName || '',
      });
    } else {
      // Offline fallback
      return res.json({
        username: req.user.username,
        role: req.user.role,
        name: 'Ramesh Kumar',
        email: 'ramesh.guardian@rentverify.in',
        phone: '+91 98765 43210',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_mxd2hKaK4VvUDRS51r4z3ZNiQ2C1eRzIK_W2adwv88lVe5yUNzynVvPVQkOvk4mHpn1koVRQuTTm_BmIBlQoVN4n6CbNYs0jE5eFcmzBxp6zamshohtAbFjqCNrM9nbCdLn1Ek1NyPQUtmNmSN5U3rD9joRoJQCFaYNWbfQsL7cGFFfro7Oc5K45fHXtvW7FIqmUbaQMdJp603D4xeuze7Ij32OOO_vYCBGlexzGGi6FyyyYSXvArDtePWcItKuWM5hr1MjGfnbs',
        propertyName: 'Greenwood Heights Apartment 302B'
      });
    }
  } catch (err) {
    console.error('[API] GET /auth/profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: isConnected ? 'connected' : 'offline',
    database: isConnected ? 'MongoDB Atlas' : 'Offline Mode',
    timestamp: new Date().toISOString(),
  });
});

// ─── Public Guest Verification by Link Token ───────────────────────

// GET /api/verifications/by-token/:token — Public lookup for guests using their secure linkToken
app.get('/api/verifications/by-token/:token', async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const verification = await Verification.findOne({ linkToken: req.params.token }).lean();
    if (!verification) {
      return res.status(404).json({ error: 'Verification link invalid or not found' });
    }

    // Check link expiration
    if (new Date(verification.linkExpiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Verification link has expired. Please contact the property host.' });
    }

    res.json(verification);
  } catch (err) {
    console.error('[API] GET /verifications/by-token error:', err);
    res.status(500).json({ error: 'Failed to look up verification link' });
  }
});

// PUT /api/verifications/by-token/:token — Public submission for guests to upload photo proofs
app.put('/api/verifications/by-token/:token', async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const existing = await Verification.findOne({ linkToken: req.params.token });
    if (!existing) {
      return res.status(404).json({ error: 'Verification link invalid or not found' });
    }

    if (new Date(existing.linkExpiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Verification link has expired.' });
    }

    const { selfieData, idImageData, idType } = req.body;
    
    // Update fields and transition status
    existing.selfieData = selfieData || existing.selfieData;
    existing.idImageData = idImageData || existing.idImageData;
    existing.idType = idType || existing.idType;
    existing.status = 'pending';
    existing.submittedAt = new Date().toISOString();

    const updated = await existing.save();

    // Generate Audit Events
    const generateId = () => require('crypto').randomBytes(4).toString('hex');
    const now = new Date().toISOString();

    const auditEvents = [
      new AuditEvent({
        id: 'ev-sub-' + generateId(),
        verificationId: updated.id,
        eventType: 'details_submitted',
        actor: 'guest',
        description: `Guest details submitted: ${updated.guestName}`,
        timestamp: now,
      }),
      new AuditEvent({
        id: 'ev-slf-' + generateId(),
        verificationId: updated.id,
        eventType: 'selfie_uploaded',
        actor: 'guest',
        description: 'Selfie photo successfully uploaded',
        timestamp: now,
      }),
      new AuditEvent({
        id: 'ev-id-' + generateId(),
        verificationId: updated.id,
        eventType: 'id_uploaded',
        actor: 'guest',
        description: `Government ID uploaded (${updated.idType})`,
        timestamp: now,
      }),
      new AuditEvent({
        id: 'ev-cmp-' + generateId(),
        verificationId: updated.id,
        eventType: 'submission_complete',
        actor: 'guest',
        description: 'Verification submission completed by guest',
        timestamp: now,
      })
    ];

    await AuditEvent.insertMany(auditEvents);

    // Trigger Admin Alert Notifications
    const frontendHost = getFrontendHost(req);
    const reviewLink = `http://${frontendHost}/`;

    const smsBody = `[Guardian Alert] ${updated.guestName} has successfully completed their check-in verification (Ref: ${updated.refCode}). Please review at ${reviewLink}`;
    
    // Send email alert to admin
    const adminEmail = notificationService.ADMIN_ALERT_EMAIL || process.env.SMTP_USER || 'admin@propertyguardian.com';
    const emailHtml = notificationService.getAdminAlertTemplate(updated.guestName, updated.refCode, reviewLink);
    const emailText = smsBody;

    // Send notifications in background
    notificationService.sendEmail(adminEmail, `Guest Verification Completed — Review Pending: ${updated.guestName}`, emailHtml, emailText);
    notificationService.sendSMS(updated.guestPhone, smsBody);
    notificationService.sendWhatsApp(updated.guestPhone, smsBody);

    res.json(updated.toObject());
  } catch (err) {
    console.error('[API] PUT /verifications/by-token error:', err);
    res.status(500).json({ error: 'Failed to submit verification details' });
  }
});

// ─── Verifications CRUD ───────────────────────────────────────────

// GET /api/verifications — List all with optional filters
app.get('/api/verifications', authenticateToken, async (req, res) => {
  try {
    if (!isConnected) return res.json([]);

    const { status, search, fromDate, toDate, sort } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { guestName: searchRegex },
        { guestPhone: searchRegex },
        { refCode: searchRegex },
        { guestEmail: searchRegex },
      ];
    }

    if (fromDate || toDate) {
      filter.submittedAt = {};
      if (fromDate) filter.submittedAt.$gte = new Date(fromDate).toISOString();
      if (toDate) filter.submittedAt.$lte = new Date(toDate).toISOString();
    }

    // Determine sort order
    let sortOption = { submittedAt: -1 }; // Default: newest first
    if (sort === 'oldest') sortOption = { submittedAt: 1 };
    if (sort === 'urgency') sortOption = { status: 1, submittedAt: 1 }; // Pending first, oldest

    const verifications = await Verification.find(filter)
      .sort(sortOption)
      .lean();

    res.json(verifications);
  } catch (err) {
    console.error('[API] GET /verifications error:', err);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

// GET /api/verifications/:id — Get single verification
app.get('/api/verifications/:id', authenticateToken, async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const verification = await Verification.findOne({ id: req.params.id }).lean();
    if (!verification) return res.status(404).json({ error: 'Verification not found' });
    res.json(verification);
  } catch (err) {
    console.error('[API] GET /verifications/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch verification' });
  }
});

// POST /api/verifications — Create new verification (Admin Inviting Guest)
app.post('/api/verifications', async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const verification = new Verification(req.body);
    await verification.save();

    // Trigger Guest Invitation Notifications
    const frontendHost = getFrontendHost(req);
    const secureLink = `http://${frontendHost}/?token=${verification.linkToken}`;

    const smsBody = `Dear ${verification.guestName}, your host has invited you to complete your secure check-in verification. Please submit your details here: ${secureLink}`;
    const emailHtml = notificationService.getInviteTemplate(verification.guestName, verification.checkinDate, verification.checkoutDate, secureLink);
    const emailText = smsBody;

    // Send notifications in background
    notificationService.sendEmail(verification.guestEmail, 'Stay Verification Invitation — Action Required', emailHtml, emailText);
    notificationService.sendSMS(verification.guestPhone, smsBody);
    notificationService.sendWhatsApp(verification.guestPhone, smsBody);

    res.status(201).json(verification.toObject());
  } catch (err) {
    console.error('[API] POST /verifications error:', err);
    res.status(500).json({ error: 'Failed to create verification' });
  }
});

// PUT /api/verifications/:id — Update verification (Admin Decisions)
app.put('/api/verifications/:id', authenticateToken, async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const verification = await Verification.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, lean: true }
    );
    if (!verification) return res.status(404).json({ error: 'Verification not found' });

    // If status was changed by the admin, dispatch guest notification
    if (req.body.status) {
      const frontendHost = getFrontendHost(req);
      const secureLink = `http://${frontendHost}/?token=${verification.linkToken}`;

      if (verification.status === 'approved') {
        const smsBody = `Dear ${verification.guestName}, your check-in verification has been successfully APPROVED! We look forward to welcoming you on ${verification.checkinDate}.`;
        const emailHtml = notificationService.getDecisionTemplate(verification.guestName, true, null, secureLink);
        
        notificationService.sendEmail(verification.guestEmail, 'Check-in Verification Approved! Welcome', emailHtml, smsBody);
        notificationService.sendSMS(verification.guestPhone, smsBody);
        notificationService.sendWhatsApp(verification.guestPhone, smsBody);
      } else if (verification.status === 'rejected') {
        const reason = verification.rejectionReason || 'Incomplete details';
        const smsBody = `Dear ${verification.guestName}, your check-in verification could not be approved. Reason: ${reason}. Please re-submit here: ${secureLink}`;
        const emailHtml = notificationService.getDecisionTemplate(verification.guestName, false, reason, secureLink);
        
        notificationService.sendEmail(verification.guestEmail, 'Check-in Verification Incomplete — Action Required', emailHtml, smsBody);
        notificationService.sendSMS(verification.guestPhone, smsBody);
        notificationService.sendWhatsApp(verification.guestPhone, smsBody);
      } else if (verification.status === 'flagged') {
        const smsBody = `Dear ${verification.guestName}, your check-in verification is placed on review hold. We will contact you shortly for additional details.`;
        notificationService.sendSMS(verification.guestPhone, smsBody);
        notificationService.sendWhatsApp(verification.guestPhone, smsBody);
      }
    }

    res.json(verification);
  } catch (err) {
    console.error('[API] PUT /verifications/:id error:', err);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

// ─── Audit Events ─────────────────────────────────────────────────

// GET /api/audit-events — List with optional verificationId filter
app.get('/api/audit-events', authenticateToken, async (req, res) => {
  try {
    if (!isConnected) return res.json([]);

    const { verificationId } = req.query;
    const filter = {};
    if (verificationId) filter.verificationId = verificationId;

    const events = await AuditEvent.find(filter)
      .sort({ timestamp: 1 })
      .lean();

    res.json(events);
  } catch (err) {
    console.error('[API] GET /audit-events error:', err);
    res.status(500).json({ error: 'Failed to fetch audit events' });
  }
});

// POST /api/audit-events — Create new audit event
app.post('/api/audit-events', async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const event = new AuditEvent(req.body);
    await event.save();
    res.status(201).json(event.toObject());
  } catch (err) {
    console.error('[API] POST /audit-events error:', err);
    res.status(500).json({ error: 'Failed to create audit event' });
  }
});

// ─── Stats Endpoint ───────────────────────────────────────────────
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    if (!isConnected) return res.json({
      pending: 0, approvedToday: 0, flagged: 0,
      totalThisMonth: 0, rejectedThisMonth: 0, avgResponseTimeMs: 0,
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [pending, flagged, approvedToday, reviewedThisMonth] = await Promise.all([
      Verification.countDocuments({ status: 'pending' }),
      Verification.countDocuments({ status: 'flagged' }),
      Verification.countDocuments({
        status: 'approved',
        reviewedAt: { $gte: todayStart },
      }),
      Verification.find({
        reviewedAt: { $gte: monthStart },
      }).select('status submittedAt reviewedAt').lean(),
    ]);

    const totalThisMonth = reviewedThisMonth.length;
    const rejectedThisMonth = reviewedThisMonth.filter(v => v.status === 'rejected').length;

    const responseTimes = reviewedThisMonth
      .filter(v => v.reviewedAt && v.submittedAt)
      .map(v => new Date(v.reviewedAt).getTime() - new Date(v.submittedAt).getTime());

    const avgResponseTimeMs = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    res.json({
      pending,
      approvedToday,
      flagged,
      totalThisMonth,
      rejectedThisMonth,
      avgResponseTimeMs,
    });
  } catch (err) {
    console.error('[API] GET /stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Seed Data Endpoint ───────────────────────────────────────────
app.post('/api/seed', authenticateToken, async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const { verifications, auditEvents } = req.body;

    // Clear existing data
    await Promise.all([
      Verification.deleteMany({}),
      AuditEvent.deleteMany({}),
    ]);

    // Insert new seed data
    if (verifications && verifications.length > 0) {
      await Verification.insertMany(verifications);
    }
    if (auditEvents && auditEvents.length > 0) {
      await AuditEvent.insertMany(auditEvents);
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

// ─── Bulk Sync Endpoint ───────────────────────────────────────────
// Used for offline-to-online sync
app.post('/api/sync', authenticateToken, async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const { verifications, auditEvents } = req.body;
    const results = { verifications: 0, auditEvents: 0 };

    // Upsert verifications
    if (verifications && verifications.length > 0) {
      const ops = verifications.map(v => ({
        updateOne: {
          filter: { id: v.id },
          update: { $set: v },
          upsert: true,
        },
      }));
      const result = await Verification.bulkWrite(ops);
      results.verifications = result.upsertedCount + result.modifiedCount;
    }

    // Upsert audit events
    if (auditEvents && auditEvents.length > 0) {
      const ops = auditEvents.map(e => ({
        updateOne: {
          filter: { id: e.id },
          update: { $set: e },
          upsert: true,
        },
      }));
      const result = await AuditEvent.bulkWrite(ops);
      results.auditEvents = result.upsertedCount + result.modifiedCount;
    }

    res.json({ success: true, synced: results });
  } catch (err) {
    console.error('[API] POST /sync error:', err);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// ─── Export Endpoint ──────────────────────────────────────────────
app.get('/api/export', authenticateToken, async (req, res) => {
  try {
    if (!isConnected) return res.status(503).json({ error: 'Database offline' });

    const [verifications, auditEvents] = await Promise.all([
      Verification.find({}).lean(),
      AuditEvent.find({}).lean(),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      verifications,
      auditEvents,
    });
  } catch (err) {
    console.error('[API] GET /export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// ─── Start Server ─────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 RentVerify API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Mode:   ${isConnected ? '☁️  Cloud (MongoDB Atlas)' : '💾 Offline (Demo Mode)'}\n`);
  });
}

start();
