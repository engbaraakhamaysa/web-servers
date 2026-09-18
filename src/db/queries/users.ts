import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { NewUser, refreshTokens, users } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();

  return result;
}

export async function deleteAllUsers() {
  await db.delete(users);
}

export async function getUserByEmail(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));

  return result;
}

export async function getUserFromRefreshToken(token: string) {
  const [result] = await db
    .select({
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token));

  return result;
}

export async function revokeRefreshToken(token: string) {
  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(refreshTokens.token, token));
}

export async function updateUser(
  userId: string,
  email: string,
  hashedPassword: string,
) {
  const [result] = await db
    .update(users)
    .set({
      email,
      hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result;
}

export async function upgradeUserToChirpyRed(userId: string) {
  const [result] = await db
    .update(users)
    .set({
      isChirpyRed: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result;
}
