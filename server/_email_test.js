import nodemailer from "nodemailer";
import "dotenv/config";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log("EMAIL_USER:", EMAIL_USER ? `${EMAIL_USER.slice(0, 3)}...` : "(missing)");
console.log("EMAIL_PASS length:", EMAIL_PASS ? EMAIL_PASS.length : "(missing)");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// 1) Verify SMTP connection
try {
  await new Promise((resolve, reject) => {
    transporter.verify((err, success) => (err ? reject(err) : resolve(success)));
  });
  console.log("✅ SMTP connection verified — credentials are valid.");
} catch (err) {
  console.log("❌ SMTP connection FAILED:", err.message);
  console.log("   code:", err.code);
  console.log("   response:", err.response);
  console.log("   responseCode:", err.responseCode);
  process.exit(1);
}

// 2) Send a test email to the same address (self-test)
try {
  const info = await transporter.sendMail({
    from: `RailGaadi <${EMAIL_USER}>`,
    to: EMAIL_USER,
    subject: "RailGaadi Email Test",
    text: "This is a test email from RailGaadi to verify the mailer works.",
  });
  console.log("✅ Test email sent:", info.messageId);
} catch (err) {
  console.log("❌ Test email FAILED:", err.message);
  console.log("   code:", err.code);
  console.log("   response:", err.response);
}
