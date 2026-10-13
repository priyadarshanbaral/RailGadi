import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return secret;
};

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const signatureFor = (input, secret) =>
  createHmac("sha256", secret).update(input).digest("base64url");

export const signAuthToken = (userId) => {
  const secret = getSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: String(userId),
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
  });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${signatureFor(unsigned, secret)}`;
};

export const verifyAuthToken = (token) => {
  try {
    const secret = getSecret();
    const [headerPart, payloadPart, suppliedSignature] = String(token || "").split(".");
    if (!headerPart || !payloadPart || !suppliedSignature) return null;

    const unsigned = `${headerPart}.${payloadPart}`;
    const expectedSignature = signatureFor(unsigned, secret);
    const expectedBuffer = Buffer.from(expectedSignature);
    const suppliedBuffer = Buffer.from(suppliedSignature);
    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    if (
      header.alg !== "HS256" ||
      typeof payload.sub !== "string" ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
};
