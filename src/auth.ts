import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { Request } from "express";
import { randomBytes } from "node:crypto";

export function makeRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(
  password: string,
  hash: string,
): Promise<boolean> {
  return await argon2.verify(hash, password);
}

// ===========================================================================================
// GET Bearer Token
// ===========================================================================================

export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("Invalid Authorization header");
  }

  return token;
}

// ===========================================================================================
// Josn Web Token
// ===========================================================================================

export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string,
): string {
  const iat = Math.floor(Date.now() / 1000);

  type payload = {
    iss: string;
    sub: string;
    iat: number;
    exp: number;
  };

  const claims: payload = {
    iss: "chirpy",
    sub: userID,
    iat,
    exp: iat + expiresIn,
  };

  return jwt.sign(claims, secret);
}

// ===========================================================================================
// Valid Data JWT
// ===========================================================================================
export function validateJWT(tokenString: string, secret: string): string {
  const decoded = jwt.verify(tokenString, secret);

  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token");
  }

  if (typeof decoded.sub !== "string") {
    throw new Error("Invalid token");
  }

  return decoded.sub;
}

export function getAPIKey(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const [scheme, key] = authHeader.split(" ");

  if (scheme !== "ApiKey" || !key) {
    throw new Error("Invalid Authorization header");
  }

  return key;
}
