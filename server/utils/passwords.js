import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export const isHashedPassword = (password) =>
  typeof password === "string" && password.startsWith("scrypt$");

export const hashPassword = async (password) => {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64url")}$${Buffer.from(key).toString("base64url")}`;
};

export const verifyPassword = async (password, storedPassword) => {
  if (typeof password !== "string" || typeof storedPassword !== "string") return false;

  if (!isHashedPassword(storedPassword)) {
    const supplied = Buffer.from(password);
    const stored = Buffer.from(storedPassword);
    return supplied.length === stored.length && timingSafeEqual(supplied, stored);
  }

  const [, saltValue, keyValue] = storedPassword.split("$");
  if (!saltValue || !keyValue) return false;

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const storedKey = Buffer.from(keyValue, "base64url");
    if (storedKey.length !== KEY_LENGTH) return false;
    const suppliedKey = Buffer.from(await scrypt(password, salt, KEY_LENGTH));
    return timingSafeEqual(suppliedKey, storedKey);
  } catch {
    return false;
  }
};
