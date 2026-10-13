import nodemailer from "nodemailer";

// ────────────────────────────────────────────────────────────────────────────
// RailGaadi — Registration Confirmation Email (Nodemailer)
//
// Reusable function that sends a professional, branded confirmation email to a
// newly registered user. Credentials come ONLY from the server-side .env file
// — never from the React/frontend code.
//
// SECURITY: This email intentionally does NOT include the user's plain-text
// password anywhere. Login is handled via the normal /api/auth/login flow, and
// password recovery is available through the app's "Forgot Password" process.
//
// Usage:
//   import { sendRegistrationConfirmation } from "../utils/sendRegistrationConfirmation.js";
//   const result = await sendRegistrationConfirmation(user);
//     // user = { name, email, userId, createdAt }
//
// Returns:
//   { success: true, messageId }   on success
//   { success: false, error }      on failure (never throws / never blocks signup)
// ────────────────────────────────────────────────────────────────────────────

// Format a raw date into a friendly, readable date-time string.
const formatDateTime = (dateValue) => {
  const d = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Escape dynamic values so user-supplied text can't break the HTML template
// or inject markup (basic hardening for name / User ID).
const esc = (value) => {
  const amp = String.fromCharCode(38); // &
  const lt = String.fromCharCode(60); // <
  const gt = String.fromCharCode(62); // >
  const quot = String.fromCharCode(34); // "
  const apos = String.fromCharCode(39); // '
  return String(value ?? "")
    .split(amp).join(amp + "amp;")
    .split(lt).join(amp + "lt;")
    .split(gt).join(amp + "gt;")
    .split(quot).join(amp + "quot;")
    .split(apos).join(amp + "apos;");
};

export const sendRegistrationConfirmation = async (user) => {
  const name = esc(user?.name);
  const email = esc(user?.email);
  const userId = esc(user?.userId || "—");
  const registeredAt = formatDateTime(user?.createdAt);

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:3000";
  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@railgaadi.com";
  const LOGIN_URL = `${FRONTEND_URL}/login`;

// Guard: if email config isn't set, don't crash the signup flow.
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "[sendRegistrationConfirmation] EMAIL_USER / EMAIL_PASS not set in .env — skipping email."
    );
    return { success: false, error: "Email credentials missing in .env" };
  }

  // Sanity check: a real Gmail App Password is exactly 16 characters.
  // A different length almost always means a placeholder or normal password
  // was pasted in, which Gmail will reject with "BadCredentials".
  if (EMAIL_PASS.length !== 16) {
    console.warn(
      `[sendRegistrationConfirmation] ⚠️ EMAIL_PASS length is ${EMAIL_PASS.length} ` +
        `(expected 16 for a Gmail App Password). A wrong-length password will be ` +
        `rejected by Gmail. Generate an App Password at ` +
        `https://myaccount.google.com/apppasswords`
    );
  }

  // 1) Create Nodemailer transporter using Gmail SMTP + App Password
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // 1b) Verify the SMTP connection up-front so misconfigured credentials
  //     surface as a clear, actionable error instead of failing silently
  //     at send time. (Never throws — registration still succeeds.)
  try {
    await new Promise((resolve, reject) => {
      transporter.verify((err, ok) => (err ? reject(err) : resolve(ok)));
    });
  } catch (verifyErr) {
    console.error(
      `[sendRegistrationConfirmation] ❌ Gmail SMTP login REJECTED. Check EMAIL_USER / EMAIL_PASS in server/.env.`,
      `\n   → ${verifyErr.message}`,
      `\n   → Response: ${verifyErr.response || "(none)"}`,
      `\n   → Ensure EMAIL_USER is a real Gmail address and EMAIL_PASS is a 16-character App Password ` +
        `(https://myaccount.google.com/apppasswords). Your normal Gmail password will NOT work.`
    );
    return { success: false, error: verifyErr.message };
  }

  // 2) Build a professional, responsive HTML email.
  //    Uses table-based layout + inline styles for Outlook / Gmail / mobile apps.
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <title>Welcome to RailGaadi – Registration Successful</title>
        <style>
          /* Only harmless resets + media queries here; inline styles carry the design */
          body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
          table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
          img { -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
          @media only screen and (max-width:600px){
            .container { width:100% !important; }
            .padding { padding:20px 16px !important; }
            .btn { display:block !important; width:100% !important; text-align:center !important; }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background:#f4f6fb; font-family:Arial, Helvetica, sans-serif;">
        <!-- Outlook-friendly wrapper tables -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6fb">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table class="container" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                     style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden;
                            border:1px solid #e3e8f0; box-shadow:0 6px 24px rgba(16,42,90,.08); mso-border-alt:thin solid #e3e8f0;">

                <!-- Header: RailGaadi logo / name -->
                <tr>
                  <td align="center" bgcolor="#0f2f6b"
                      style="background:#0f2f6b; background:linear-gradient(135deg,#0f2f6b 0%,#1e56c8 100%); padding:32px 28px;">
                    <div style="font-size:44px; line-height:1;">🚆</div>
                    <h1 style="margin:8px 0 4px; font-size:26px; letter-spacing:.5px; color:#ffffff; font-family:Arial, Helvetica, sans-serif;">RailGaadi</h1>
                    <p style="margin:0; opacity:.85; font-size:14px; color:#ffffff;">Smart &bull; Reliable &bull; Connected Railway Travel</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td class="padding" style="padding:32px 28px; color:#1e2a41; line-height:1.65; font-size:15px;">
                    <p style="margin:0 0 14px; font-size:18px; font-weight:bold; color:#0f2f6b;">Hello ${name},</p>
                    <p style="margin:0 0 12px;">
                      Welcome to <strong>RailGaadi! 🚆</strong>
                    </p>
                    <p style="margin:0 0 18px;">
                      Your RailGaadi account has been <strong>successfully created</strong>.
                      Please find your account details below.
                    </p>

                    <!-- Account details block -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="background:#f0f5ff; border:1px dashed #9fc0ff; border-radius:10px; margin:18px 0; font-size:14px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 10px; font-weight:bold; color:#0f2f6b; font-size:15px;">Your Account Details</p>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding:5px 0; color:#5a6b8c; font-weight:600; width:130px;" valign="top">User ID:</td>
                              <td style="padding:5px 0; color:#0f2f6b; font-weight:bold; word-break:break-all;">${userId}</td>
                            </tr>
                            <tr>
                              <td style="padding:5px 0; color:#5a6b8c; font-weight:600; width:130px;" valign="top">Name:</td>
                              <td style="padding:5px 0; color:#0f2f6b; font-weight:bold;">${name}</td>
                            </tr>
                            <tr>
                              <td style="padding:5px 0; color:#5a6b8c; font-weight:600; width:130px;" valign="top">Email:</td>
                              <td style="padding:5px 0; color:#0f2f6b; font-weight:bold; word-break:break-all;">${email}</td>
                            </tr>
                            <tr>
                              <td style="padding:5px 0; color:#5a6b8c; font-weight:600; width:130px; border:0;" valign="top">Registered:</td>
                              <td style="padding:5px 0; color:#0f2f6b; font-weight:bold;">${registeredAt}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 18px;">
                      You can now log in to RailGaadi and explore train information,
                      live train tracking, journey details, and other railway services.
                    </p>

                    <!-- Login button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
                      <tr>
                        <td align="center">
                          <a href="${LOGIN_URL}" class="btn" target="_blank"
                             style="display:inline-block; background:#f97316; background:linear-gradient(135deg,#f97316,#f59e0b);
                                    color:#ffffff; text-decoration:none; font-weight:bold; font-size:15px; padding:14px 34px;
                                    border-radius:50px; box-shadow:0 6px 16px rgba(249,115,22,.35); font-family:Arial, Helvetica, sans-serif;">
                            Login to RailGaadi
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:14px 0 0; text-align:center; font-size:13px; color:#5a6b8c;">
                      Visit us at <a href="${FRONTEND_URL}" style="color:#1e56c8; text-decoration:none;">${FRONTEND_URL}</a>
                    </p>

                    <!-- Security message -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="background:#fff8ec; border:1px solid #fde3b3; border-radius:10px; margin:22px 0 0;">
                      <tr>
                        <td style="padding:14px 16px; font-size:13px; color:#7a5a12; line-height:1.6;">
                          <strong>🔒 For your security:</strong> Please do not share your login credentials with anyone.
                          RailGaadi will never ask for your password by email. If you ever need to reset your password,
                          use the secure "Forgot Password" option on the login page.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer / support -->
                <tr>
                  <td class="padding" style="padding:24px 28px; background:#f8fafc; border-top:1px solid #eef2f8; color:#4a5a78; font-size:13px;">
                    <div style="line-height:1.6; color:#1e2a41;">
                      <strong>Thank you for joining RailGaadi.</strong><br />
                      <span>RailGaadi Team</span><br />
                      <span style="color:#0f2f6b;">Smart &bull; Reliable &bull; Connected Railway Travel</span>
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                      <tr>
                        <td align="center" style="font-size:12px; color:#8294b0; line-height:1.7;">
                          <div>📧 Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:#8294b0;">${SUPPORT_EMAIL}</a></div>
                          <div>🌐 <a href="${FRONTEND_URL}" style="color:#8294b0; text-decoration:none;">${FRONTEND_URL}</a></div>
                          <div style="margin-top:10px;">&copy; ${new Date().getFullYear()} RailGaadi. All rights reserved.</div>
                          <div style="margin-top:6px;">This is an automated message. Please do not reply to this email.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // 3) Configure the mail options
  const mailOptions = {
    from: `RailGaadi <${EMAIL_USER}>`,
    to: email,
    subject: "Welcome to RailGaadi – Registration Successful",
    html,
  };

  // 4) Send the email with robust error handling
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[sendRegistrationConfirmation] ✅ Email sent to ${email} — ${info.messageId}`
    );
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Log the error but never throw — registration should still succeed.
    console.error(
      `[sendRegistrationConfirmation] ❌ Failed to send email to ${email}:`,
      err.message
    );
    return { success: false, error: err.message };
  }
};
