import { describe, it, expect } from "vitest";
import { makeJWT, validateJWT, getBearerToken } from "./auth.js";

describe("JWT", () => {
  it("should create and validate a JWT", () => {
    const secret = "test-secret";
    const userID = "user-123";

    const token = makeJWT(userID, 3600, secret);
    const result = validateJWT(token, secret);

    expect(result).toBe(userID);
  });

  it("should reject an expired JWT", () => {
    const secret = "test-secret";
    const userID = "user-123";

    const token = makeJWT(userID, -1, secret);

    expect(() => validateJWT(token, secret)).toThrow();
  });

  it("should reject a JWT signed with the wrong secret", () => {
    const secret = "test-secret";
    const wrongSecret = "wrong-secret";
    const userID = "user-123";

    const token = makeJWT(userID, 3600, secret);

    expect(() => validateJWT(token, wrongSecret)).toThrow();
  });
});

describe("Bearer Token", () => {
  it("should extract the token from the Authorization header", () => {
    const req = {
      get: (header: string) => {
        if (header === "Authorization") {
          return "Bearer abc123";
        }
        return undefined;
      },
    } as any;

    const token = getBearerToken(req);

    expect(token).toBe("abc123");
  });

  it("should throw if the Authorization header is missing", () => {
    const req = {
      get: () => undefined,
    } as any;

    expect(() => getBearerToken(req)).toThrow();
  });
});
