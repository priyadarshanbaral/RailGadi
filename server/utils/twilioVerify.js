const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (
    !/^AC[a-f0-9]{32}$/i.test(accountSid || "") ||
    !authToken ||
    /your-|xxxxxxxx/i.test(authToken) ||
    !/^VA[a-f0-9]{32}$/i.test(serviceSid || "")
  ) {
    const error = new Error(
      "Twilio Verify is not configured. Set a valid TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in server/.env."
    );
    error.statusCode = 503;
    throw error;
  }

  return { accountSid, authToken, serviceSid };
};

export const isTwilioConfigured = () => {
  try {
    getTwilioConfig();
    return true;
  } catch {
    return false;
  }
};

const requestTwilio = async (path, fields) => {
  const { accountSid, authToken, serviceSid } = getTwilioConfig();
  const authorization = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  let response;

  try {
    response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(fields),
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch (cause) {
    const error = new Error("Could not reach Twilio Verify. Check the server's internet connection and try again.", {
      cause,
    });
    error.statusCode = 502;
    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch (cause) {
    const error = new Error("Twilio Verify returned an unreadable response.", { cause });
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const statusCode =
      response.status === 401 || response.status === 403
        ? 503
        : response.status === 429
          ? 429
          : response.status >= 500
            ? 502
            : 400;
    const error = new Error(
      statusCode === 503
        ? "Twilio rejected the Verify credentials. Check the Account SID, Auth Token, and Verify Service SID in server/.env."
        : statusCode === 429
          ? "Twilio Verify rate limit reached. Wait before trying again."
          : statusCode === 502
            ? "Twilio Verify is temporarily unavailable. Try again shortly."
            : "Twilio could not process this verification request. Check the phone number and Verify service configuration."
    );
    error.statusCode = statusCode;
    error.providerCode = result.code;
    throw error;
  }

  return result;
};

export const sendTwilioVerification = async (phone) =>
  requestTwilio("Verifications", { To: phone, Channel: "sms" });

export const checkTwilioVerification = async (phone, code) => {
  const result = await requestTwilio("VerificationCheck", { To: phone, Code: code });
  return result.status === "approved";
};
