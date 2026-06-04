/**
 * @file middleware/firebaseAuth.js
 * @description Authentication middleware that supports both Firebase ID tokens
 * and fallback JWT tokens. Extracts user info and attaches to req.user.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rentverify_secret_secure_key_12345';

// Firebase Admin SDK (lazy-initialized)
let firebaseAdmin = null;

function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  try {
    const admin = require('firebase-admin');
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountPath) {
      const serviceAccount = require(require('path').resolve(serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
      });
      firebaseAdmin = admin;
      console.log('[Auth] ✅ Firebase Admin SDK initialized with service account.');
    } else if (projectId) {
      admin.initializeApp({ projectId });
      firebaseAdmin = admin;
      console.log('[Auth] ✅ Firebase Admin SDK initialized with project ID.');
    }
  } catch (err) {
    console.warn('[Auth] Firebase Admin SDK not available:', err.message);
  }

  return firebaseAdmin;
}

/**
 * Express middleware to verify authentication tokens.
 * Supports:
 * 1. Firebase ID tokens (verified via Firebase Admin SDK)
 * 2. Local JWT tokens (fallback when Firebase is not configured)
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // Try Firebase verification first
  const admin = getFirebaseAdmin();
  if (admin) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = {
        firebaseUid: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || '',
      };
      return next();
    } catch (firebaseErr) {
      // Token may be a local JWT, try fallback
    }
  }

  // Fallback: verify as local JWT
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token' });
    }
    req.user = decoded;
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };
