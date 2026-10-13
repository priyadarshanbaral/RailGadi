import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import CountryPhoneInput from "./CountryPhoneInput.jsx";

export default function PhoneOtpLogin({ onSuccess, onCancel }) {
  const { sendPhoneOtp, verifyOtp, resendOtp, authLoading } = useApp();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSend = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError("Please enter a valid mobile number.");
      return;
    }
    const result = await sendPhoneOtp(phone);
    if (result.ok) {
      setStep("otp");
      setCooldown(30);
      setMessage(`Verification SMS request accepted for ${phone}.`);
    } else {
      setError(result.error || "Could not send a verification code. Please try again.");
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit code from your SMS.");
      return;
    }
    const result = await verifyOtp({ phone }, otp);
    if (result.ok) {
      onSuccess(result);
    } else {
      setError(result.error || "The verification code could not be verified.");
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || authLoading) return;
    setError("");
    setMessage("");
    const result = await resendOtp(phone);
    if (result.ok) {
      setOtp("");
      setCooldown(30);
      setMessage(`A new verification SMS request was accepted for ${phone}.`);
    } else {
      setError(result.error || "Could not resend the verification code.");
    }
  };

  return (
    <div className="phone-otp-login">
      {error && <div className="auth-error" role="alert">{error}</div>}
      {message && <div className="auth-success" role="status">{message}</div>}

      {step === "phone" ? (
        <form className="auth-form" onSubmit={handleSend}>
          <div className="form-field">
            <label>Mobile Number</label>
            <CountryPhoneInput value={phone} onChange={setPhone} disabled={authLoading} />
          </div>
          <button className="btn btn-primary auth-submit" type="submit" disabled={authLoading}>
            {authLoading ? "Sending code..." : "Send Login Code"}
          </button>
          {onCancel && (
            <button className="auth-link" type="button" onClick={onCancel} disabled={authLoading}>
              Use email and password
            </button>
          )}
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleVerify}>
          <div className="form-field">
            <label>6-Digit Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              placeholder="Enter the code from your SMS"
              disabled={authLoading}
            />
          </div>
          <button className="btn btn-primary auth-submit" type="submit" disabled={authLoading || otp.length !== 6}>
            {authLoading ? "Verifying..." : "Verify & Login"}
          </button>
          <button className="auth-link" type="button" onClick={handleResend} disabled={authLoading || cooldown > 0}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
          <button
            className="auth-link"
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
              setMessage("");
            }}
            disabled={authLoading}
          >
            Change mobile number
          </button>
        </form>
      )}
    </div>
  );
}
