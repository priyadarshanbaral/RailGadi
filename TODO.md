# RailGaadi Registration Confirmation Email — Fix

## Root Cause (confirmed via live diagnostic)
- `server/.env` has a **placeholder** Gmail (`EMAIL_USER` starts with `you...`) and a **23-char** `EMAIL_PASS`
  (real Gmail App Passwords are exactly **16 chars**).
- Gmail rejects login with `535-5.7.8 Username and Password not accepted (BadCredentials)`,
  so no confirmation email is delivered.

## Steps
- [x] Explore existing email flow (sendRegistrationConfirmation.js, authRoutes.js, User model, README)
- [x] Run live SMTP diagnostic (`_email_test.js`) → confirmed EAUTH / BadCredentials
- [x] Improve `sendRegistrationConfirmation.js` — add transporter `verify()` + clear error logging
- [x] Surface email status in `authRoutes.js` register response (both DB + in-memory paths, non-blocking)
- [x] Pass email status through frontend (`AppContext.jsx`, `Auth.jsx`)
- [x] Show email delivery status/warning in `RegistrationSuccess.jsx`
- [x] Update `server/.env.example` + README with clearer App Password steps
- [x] `node --check` on modified server files — syntax OK
- [ ] **USER ACTION:** Fix `server/.env` with a REAL Gmail account + valid 16-char App Password
- [ ] Re-run diagnostic to confirm SMTP login succeeds
- [ ] Register a test user and confirm the email arrives
- [ ] Remove temporary `_email_test.js`
