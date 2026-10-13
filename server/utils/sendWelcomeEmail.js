import nodemailer from "nodemailer";

// ────────────────────────────────────────────────────────────────────────────
// RailGaadi — Welcome Email (Nodemailer)
//
// Reusable function that sends a branded welcome email to a newly registered
// user. Credentials come ONLY from the server-side .env file — never from the
// React/frontend code.
//
// Usage:
//   import { sendWelcomeEmail } from "../utils/sendWelcomeEmail.js";
//   await sendWelcomeEmail(email, name, userId, password);
// ────────────────────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (email, name, userId, password) => {
  // Grab credentials from environment. If missing, refuse silently (see below).
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

  // Guard: if email config isn't set, don't crash the signup flow.
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "[sendWelcomeEmail] EMAIL_USER / EMAIL_PASS not set in .env — skipping email."
    );
    return { success: false, error: "Email credentials missing in .env" };
  }

  // 1) Create Nodemailer transporter using Gmail SMTP + App Password
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // 2) Build a professional, branded HTML email
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to RailGaadi 🚆</title>
        <style>
          body { margin:0; padding:0; background-color:#f4f6fb; font-family: Arial, Helvetica, sans-serif; }
          .wrap { max-width:640px; margin:0 auto; padding:24px; }
          .card { background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e3e8f0; box-shadow:0 6px 24px rgba(16,42,90,.08); }
          .header { background:linear-gradient(135deg,#0f2f6b 0%,#1e56c8 100%); color:#ffffff; padding:32px 28px; text-align:center; }
          .header .icon { font-size:48px; }
          .header h1 { margin:8px 0 4px; font-size:26px; letter-spacing:.5px; }
          .header p { margin:0; opacity:.85; font-size:14px; }
          .body { padding:32px 28px; color:#1e2a41; line-height:1.65; font-size:15px; }
          .body .greet { font-size:18px; font-weight:bold; color:#0f2f6b; margin:0 0 12px; }
          .creds { background:#f0f5ff; border:1px dashed #9fc0ff; border-radius:10px; padding:16px 18px; margin:20px 0; font-size:14px; }
          .creds table { width:100%; border-collapse:collapse; }
          .creds td { padding:6px 0; vertical-align:top; }
          .creds .label { color:#5a6b8c; font-weight:600; width:120px; }
          .creds .value { color:#0f2f6b; font-weight:bold; word-break:break-all; }
          .btn-wrap { text-align:center; margin:26px 0 8px; }
          .btn { display:inline-block; background:linear-gradient(135deg,#f97316,#f59e0b); color:#ffffff; text-decoration:none; font-weight:bold; font-size:15px; padding:14px 34px; border-radius:50px; box-shadow:0 6px 16px rgba(249,115,22,.35); }
          .btn:hover { filter:brightness(1.05); }
          .footer { padding:24px 28px; background:#f8fafc; border-top:1px solid #eef2f8; color:#4a5a78; font-size:13px; }
          .footer .sign { line-height:1.5; color:#1e2a41; }
          .footer .ceo { font-weight:bold; color:#0f2f6b; }
          .footer .small { margin-top:14px; color:#8294b0; font-size:11px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <div class="header">
              <div class="icon">🚆</div>
              <h1>Welcome to RailGaadi 🚆</h1>
              <p>Registration Successful</p>
            </div>

            <div class="body">
              <p class="greet">Hello ${name},</p>
              <p>
                Your RailGaadi account has been successfully created. Here are
                your login credentials — please keep them safe.
              </p>

              <div class="creds">
                <table>
                  <tr>
                    <td class="label">User ID:</td>
                    <td class="value">${userId}</td>
                  </tr>
                  <tr>
                    <td class="label">Email&nbsp;ID:</td>
                    <td class="value">${email}</td>
                  </tr>
                  <tr>
                    <td class="label">Password:</td>
                    <td class="value">${password}</td>
                  </tr>
                </table>
              </div>

              <p>You can now log in to your RailGaadi account and start tracking trains in real time.</p>

              <div class="btn-wrap">
                <a href="${FRONTEND_URL}/dashboard" class="btn" target="_blank">Login to RailGaadi</a>
              </div>
            </div>

            <div class="footer">
              <div><strong>Regards,</strong></div>
              <div class="sign">
                <span>RailGaadi Team</span><br />
                <span class="ceo">Priyadarshan Baral</span><br />
                <span>CEO, RailGaadi</span>
              </div>
              <div class="small">
                This is an automated message. Please do not reply to this email.
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // 3) Configure the mail options
  const mailOptions = {
    from: `RailGaadi <${EMAIL_USER}>`,
    to: email,
    subject: "Welcome to RailGaadi 🚆 – Registration Successful",
    html,
  };

  // 4) Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendWelcomeEmail] ✅ Email sent to ${email} — ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Log the error but never throw — registration should still succeed.
    console.error(`[sendWelcomeEmail] ❌ Failed to send email to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
};
