/**
 * @file notificationService.cjs
 * @description Services for sending real-world SMS, WhatsApp messages, and Emails.
 * Falls back to beautiful terminal logs if credentials are not provided.
 */

const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Retrieve configurations from environment
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SMS_NUMBER,
  TWILIO_WHATSAPP_NUMBER,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  ADMIN_ALERT_EMAIL,
} = process.env;

// Initialize clients if credentials exist
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('[NotificationService] 📱 Twilio SMS & WhatsApp client initialized.');
  } catch (err) {
    console.error('[NotificationService] ❌ Failed to initialize Twilio client:', err.message);
  }
}

let emailTransporter = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10) || 587,
      secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log('[NotificationService] ✉️ Nodemailer SMTP transporter initialized.');
  } catch (err) {
    console.error('[NotificationService] ❌ Failed to initialize SMTP transporter:', err.message);
  }
}

/**
 * Sends a real-world SMS, falling back to simulator logs if credentials are missing
 * @param {string} to - Destination phone number (e.g. +919876543210)
 * @param {string} body - Message body
 */
async function sendSMS(to, body) {
  if (!to) return;
  const targetPhone = to.trim();

  if (twilioClient && TWILIO_SMS_NUMBER) {
    try {
      await twilioClient.messages.create({
        body,
        from: TWILIO_SMS_NUMBER,
        to: targetPhone,
      });
      console.log(`[NotificationService] ✅ SMS successfully sent to ${targetPhone}`);
      return { success: true, mode: 'real' };
    } catch (err) {
      console.error(`[NotificationService] ❌ Failed to send SMS to ${targetPhone}:`, err.message);
      logSimulatedSMS(targetPhone, body, `Error: ${err.message}`);
      return { success: false, error: err.message, mode: 'simulated' };
    }
  } else {
    logSimulatedSMS(targetPhone, body);
    return { success: true, mode: 'simulated' };
  }
}

/**
 * Sends a real-world WhatsApp message using Twilio, falling back to simulator logs
 * @param {string} to - Destination phone number (e.g. +919876543210)
 * @param {string} body - Message body
 */
async function sendWhatsApp(to, body) {
  if (!to) return;
  const rawPhone = to.trim();
  const targetPhone = rawPhone.startsWith('whatsapp:') ? rawPhone : `whatsapp:${rawPhone}`;
  const senderNumber = TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox number default

  if (twilioClient) {
    try {
      await twilioClient.messages.create({
        body,
        from: senderNumber,
        to: targetPhone,
      });
      console.log(`[NotificationService] ✅ WhatsApp successfully sent to ${targetPhone}`);
      return { success: true, mode: 'real' };
    } catch (err) {
      console.error(`[NotificationService] ❌ Failed to send WhatsApp to ${targetPhone}:`, err.message);
      logSimulatedWhatsApp(targetPhone, body, `Error: ${err.message}`);
      return { success: false, error: err.message, mode: 'simulated' };
    }
  } else {
    logSimulatedWhatsApp(targetPhone, body);
    return { success: true, mode: 'simulated' };
  }
}

/**
 * Sends a real-world Email, falling back to simulator logs if missing
 * @param {string} to - Guest or Admin email address
 * @param {string} subject - Email subject line
 * @param {string} html - Styled HTML template body
 * @param {string} text - Text fallback
 */
async function sendEmail(to, subject, html, text) {
  if (!to) return;
  const targetEmail = to.trim();

  if (emailTransporter && SMTP_USER) {
    try {
      await emailTransporter.sendMail({
        from: `"Property Guardian" <${SMTP_USER}>`,
        to: targetEmail,
        subject,
        text: text || subject,
        html,
      });
      console.log(`[NotificationService] ✅ Email successfully sent to ${targetEmail}`);
      return { success: true, mode: 'real' };
    } catch (err) {
      console.error(`[NotificationService] ❌ Failed to send Email to ${targetEmail}:`, err.message);
      logSimulatedEmail(targetEmail, subject, text || subject, `Error: ${err.message}`);
      return { success: false, error: err.message, mode: 'simulated' };
    }
  } else {
    logSimulatedEmail(targetEmail, subject, text || subject);
    return { success: true, mode: 'simulated' };
  }
}

// ─── ASCII Logging Simulators ──────────────────────────────────────

function logSimulatedSMS(to, body, warn = '') {
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│             📱 SIMULATED SMS OUTBOX (DEMO)             │');
  if (warn) {
    console.log(`│  ⚠️  ${warn.padEnd(52)} │`);
  }
  console.log('├────────────────────────────────────────────────────────┤');
  console.log(`│ TO:   ${to.padEnd(48)} │`);
  console.log('├────────────────────────────────────────────────────────┤');
  
  // Wrap body text nicely
  const words = body.split(' ');
  let line = '';
  for (const word of words) {
    if ((line + word).length > 48) {
      console.log(`│ ${line.padEnd(54)} │`);
      line = word + ' ';
    } else {
      line += word + ' ';
    }
  }
  if (line) {
    console.log(`│ ${line.padEnd(54)} │`);
  }
  console.log('└────────────────────────────────────────────────────────┘\n');
}

function logSimulatedWhatsApp(to, body, warn = '') {
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│          💬 SIMULATED WHATSAPP OUTBOX (DEMO)           │');
  if (warn) {
    console.log(`│  ⚠️  ${warn.padEnd(52)} │`);
  }
  console.log('├────────────────────────────────────────────────────────┤');
  console.log(`│ TO:   ${to.padEnd(48)} │`);
  console.log('├────────────────────────────────────────────────────────┤');
  
  const words = body.split(' ');
  let line = '';
  for (const word of words) {
    if ((line + word).length > 48) {
      console.log(`│ ${line.padEnd(54)} │`);
      line = word + ' ';
    } else {
      line += word + ' ';
    }
  }
  if (line) {
    console.log(`│ ${line.padEnd(54)} │`);
  }
  console.log('└────────────────────────────────────────────────────────┘\n');
}

function logSimulatedEmail(to, subject, text, warn = '') {
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│            ✉️  SIMULATED EMAIL OUTBOX (DEMO)            │');
  if (warn) {
    console.log(`│  ⚠️  ${warn.padEnd(52)} │`);
  }
  console.log('├────────────────────────────────────────────────────────┤');
  console.log(`│ TO:      ${to.padEnd(45)} │`);
  console.log(`│ SUBJECT: ${subject.substring(0, 42).padEnd(45)} │`);
  console.log('├────────────────────────────────────────────────────────┤');
  
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    if ((line + word).length > 48) {
      console.log(`│ ${line.padEnd(54)} │`);
      line = word + ' ';
    } else {
      line += word + ' ';
    }
  }
  if (line) {
    console.log(`│ ${line.padEnd(54)} │`);
  }
  console.log('└────────────────────────────────────────────────────────┘\n');
}

// ─── Styled HTML Email Templates ───────────────────────────────────

/**
 * HTML Template for Check-in Invitation
 */
function getInviteTemplate(guestName, checkinDate, checkoutDate, secureLink) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 20px; color: #2c3e50; }
        .card { max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background: linear-gradient(135deg, #6c63ff 0%, #3f37c9 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 30px; line-height: 1.6; }
        .guest-name { font-size: 18px; font-weight: 600; color: #1a1a2e; margin-bottom: 10px; }
        .dates-box { background-color: #f0f3ff; border-left: 4px solid #6c63ff; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .dates-title { font-size: 12px; text-transform: uppercase; color: #6c63ff; font-weight: 700; margin-bottom: 5px; }
        .dates-values { font-size: 16px; font-weight: 600; color: #1e1e30; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 14px 28px; background: #6c63ff; color: #ffffff !important; text-decoration: none; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 6px rgba(108,99,255,0.2); transition: all 0.2s ease; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #8898aa; background-color: #fafbfc; border-top: 1px solid #eef2f5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Guardian Verified</h1>
        </div>
        <div class="content">
          <div class="guest-name">Hello ${guestName},</div>
          <p>Your property host has initiated your secure check-in verification for your upcoming stay. To ensure a seamless check-in experience, please verify your details and upload your government-approved photo ID.</p>
          
          <div class="dates-box">
            <div class="dates-title">Stay Duration</div>
            <div class="dates-values">${checkinDate} &mdash; ${checkoutDate}</div>
          </div>
          
          <p>Please complete this quick verification from your mobile device or web browser by clicking the secure link below.</p>
          
          <div class="btn-container">
            <a href="${secureLink}" class="btn">Verify My Identity</a>
          </div>
          
          <p style="font-size: 13px; color: #7f8c8d; line-height: 1.4;">If the button doesn't work, copy and paste this URL into your browser:<br>
          <a href="${secureLink}" style="color: #6c63ff; word-break: break-all;">${secureLink}</a></p>
        </div>
        <div class="footer">
          &copy; 2026 Property Guardian. All rights reserved.<br>
          This is an automated security verification message. Please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * HTML Template for Guest Submission Ready for Admin Review
 */
function getAdminAlertTemplate(guestName, refCode, reviewLink) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 20px; color: #2c3e50; }
        .card { max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background: #1a1a2e; padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #00b894; }
        .content { padding: 30px; line-height: 1.6; }
        .alert-title { font-size: 18px; font-weight: 600; color: #1e1e30; margin-bottom: 15px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 10px; border-bottom: 1px solid #f1f3f5; }
        .info-label { font-weight: 600; color: #7f8c8d; width: 35%; }
        .info-value { color: #2c3e50; font-weight: 600; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; background: #00b894; color: #ffffff !important; text-decoration: none; font-weight: bold; border-radius: 8px; transition: all 0.2s ease; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #8898aa; background-color: #fafbfc; border-top: 1px solid #eef2f5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Guardian Alert</h1>
        </div>
        <div class="content">
          <div class="alert-title">Guest Verification Completed</div>
          <p>A new guest has completed their digital verification flow. Please review and approve their documents in your Admin Dashboard.</p>
          
          <table class="info-table">
            <tr>
              <td class="info-label">Guest Name</td>
              <td class="info-value">${guestName}</td>
            </tr>
            <tr>
              <td class="info-label">Reference ID</td>
              <td class="info-value" style="font-family: monospace;">${refCode}</td>
            </tr>
            <tr>
              <td class="info-label">Submitted At</td>
              <td class="info-value">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          
          <div class="btn-container">
            <a href="${reviewLink}" class="btn">Open Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 Property Guardian. Secure Identity Verifications.<br>
          Admin Alert System.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * HTML Template for Guest Decision Notification (Approved / Rejected)
 */
function getDecisionTemplate(guestName, isApproved, rejectionReason, loginLink) {
  const primaryColor = isApproved ? '#00b894' : '#d63031';
  const statusTitle = isApproved ? 'Check-in Approved' : 'Action Required';
  const statusMessage = isApproved
    ? `Great news! Your check-in documents have been successfully verified and approved. You are good to check in upon arrival.`
    : `We were unable to approve your check-in documents due to the following reason:<br><strong style="color: #d63031;">&ldquo;${rejectionReason}&rdquo;</strong><br><br>Please re-submit your verification using your original link to complete your check-in.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 20px; color: #2c3e50; }
        .card { max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background: ${primaryColor}; padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 30px; line-height: 1.6; }
        .guest-name { font-size: 18px; font-weight: 600; color: #1e1e30; margin-bottom: 10px; }
        .status-card { border: 1px solid ${primaryColor}40; background-color: ${primaryColor}0a; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; background: ${primaryColor}; color: #ffffff !important; text-decoration: none; font-weight: bold; border-radius: 8px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #8898aa; background-color: #fafbfc; border-top: 1px solid #eef2f5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${statusTitle}</h1>
        </div>
        <div class="content">
          <div class="guest-name">Hello ${guestName},</div>
          <p>The property administrator has updated the status of your check-in verification request.</p>
          
          <div class="status-card">
            ${statusMessage}
          </div>
          
          ${!isApproved ? `
          <div class="btn-container">
            <a href="${loginLink}" class="btn">Update Verification</a>
          </div>
          ` : ''}
          
          <p>If you have any questions, feel free to reply directly or contact the property managers.</p>
        </div>
        <div class="footer">
          &copy; 2026 Property Guardian. All rights reserved.<br>
          Automated Booking Assistant.
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  sendSMS,
  sendWhatsApp,
  sendEmail,
  getInviteTemplate,
  getAdminAlertTemplate,
  getDecisionTemplate,
  ADMIN_ALERT_EMAIL,
};
