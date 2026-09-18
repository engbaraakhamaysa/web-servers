import express, { Request, Response, NextFunction } from "express";
import postgres from "postgres";
import { config } from "./config.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

import {
  deleteAllUsers,
  createUser,
  getUserByEmail,
  getUserFromRefreshToken,
  revokeRefreshToken,
  updateUser,
  upgradeUserToChirpyRed,
} from "./db/queries/users.js";
import {
  createChirp,
  getChirps,
  getChirp,
  deleteChirp,
} from "./db/queries/chirps.js";
import {
  checkPasswordHash,
  getAPIKey,
  getBearerToken,
  hashPassword,
  makeJWT,
  makeRefreshToken,
  validateJWT,
} from "./auth.js";
import { db } from "./db/index.js";
import { refreshTokens } from "./db/schema.js";

// ===========================================================================================
// Database Migration
// ===========================================================================================

const migrationClient = postgres(config.db.url, { max: 1 });

await migrate(drizzle(migrationClient), config.db.migrationConfig);

// ===========================================================================================
// Express App
// ===========================================================================================

const app = express();

app.use(express.json());

// ===========================================================================================
// Custom Errors
// ===========================================================================================

class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// ===========================================================================================
// Error Handler
// ===========================================================================================

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof BadRequestError) {
    res.status(400).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: err.message,
    });
    return;
  }

  console.log(err);

  res.status(500).json({
    error: "Something went wrong on our end",
  });
}

// ===========================================================================================
// Validate Chirp Handler
// ===========================================================================================

function handlerValidateChirp(req: Request, res: Response) {
  type parameters = {
    body: string;
  };

  const params: parameters = req.body;

  if (typeof params.body !== "string") {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (params.body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  const profaneWords = ["kerfuffle", "sharbert", "fornax"];

  const words = params.body.split(" ");

  const cleanedWords = words.map((word) => {
    if (profaneWords.includes(word.toLowerCase())) {
      return "****";
    }

    return word;
  });

  const cleanedBody = cleanedWords.join(" ");

  res.status(200).json({ cleanedBody });
}

// ===========================================================================================
// Response Logging Middleware
// ===========================================================================================

function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => {
    const statusCode = res.statusCode;

    if (statusCode !== 200) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
    }
  });

  next();
}

// ===========================================================================================
// Fileserver Metrics Middleware
// ===========================================================================================

function middlewareMetricsInc(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  config.api.fileserverHits += 1;
  next();
}

// ===========================================================================================
// Health Check Handler
// ===========================================================================================

function handlerReadiness(_req: Request, res: Response) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
}

// ===========================================================================================
// Metrics Handler
// ===========================================================================================

function handlerMetrics(_req: Request, res: Response) {
  res.set("Content-Type", "text/html; charset=utf-8");

  res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>
`);
}

// ===========================================================================================
// Get All Chirps Handler
// ===========================================================================================
async function handlerGetChirps(req: Request, res: Response) {
  let authorId = "";

  const authorIdQuery = req.query.authorId;

  if (typeof authorIdQuery === "string") {
    authorId = authorIdQuery;
  }

  let sort = "asc";

  const sortQuery = req.query.sort;

  if (typeof sortQuery === "string") {
    sort = sortQuery;
  }

  const chirps = await getChirps(authorId || undefined);

  if (sort === "desc") {
    chirps.reverse();
  }

  res.status(200).json(chirps);
}
// ===========================================================================================
// Get Single Chirp Handler
// ===========================================================================================

async function handlerGetChirp(
  req: Request<{ chirpId: string }>,
  res: Response,
) {
  const chirp = await getChirp(req.params.chirpId);

  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }

  res.status(200).json(chirp);
}

// ===========================================================================================
// Create Chirp Handler
// ===========================================================================================
async function handlerCreateChirp(req: Request, res: Response) {
  const token = getBearerToken(req);

  let userID: string;

  try {
    userID = validateJWT(token, config.api.jwtSecret);
  } catch {
    throw new UnauthorizedError("Invalid token");
  }

  type parameters = {
    body: string;
  };

  const params: parameters = req.body;

  if (typeof params.body !== "string") {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (params.body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  const profaneWords = ["kerfuffle", "sharbert", "fornax"];

  const words = params.body.split(" ");

  const cleanedWords = words.map((word) => {
    if (profaneWords.includes(word.toLowerCase())) {
      return "****";
    }

    return word;
  });

  const cleanedBody = cleanedWords.join(" ");

  const chirp = await createChirp({
    body: cleanedBody,
    userId: userID,
  });

  res.status(201).json(chirp);
}

// ===========================================================================================
// Update User
// ===========================================================================================
async function handlerUpdateUser(req: Request, res: Response) {
  let userID: string;

  try {
    const token = getBearerToken(req);
    userID = validateJWT(token, config.api.jwtSecret);
  } catch {
    throw new UnauthorizedError("Invalid token");
  }

  type parameters = {
    email: string;
    password: string;
  };

  const params: parameters = req.body;

  if (typeof params.email !== "string" || typeof params.password !== "string") {
    res.status(400).json({
      error: "Invalid request body",
    });
    return;
  }

  const hashedPassword = await hashPassword(params.password);

  const user = await updateUser(userID, params.email, hashedPassword);

  res.status(200).json({
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
    email: user.email,
  });
}

// ===========================================================================================
// Refresh Token
// ===========================================================================================
async function handlerDeleteChirp(
  req: Request<{ chirpId: string }>,
  res: Response,
) {
  let userID: string;

  try {
    const token = getBearerToken(req);
    userID = validateJWT(token, config.api.jwtSecret);
  } catch {
    throw new UnauthorizedError("Invalid token");
  }

  const chirp = await getChirp(req.params.chirpId);

  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }

  if (chirp.userId !== userID) {
    throw new ForbiddenError("Forbidden");
  }

  await deleteChirp(req.params.chirpId);

  res.status(204).send();
}

// ===========================================================================================
// Refresh Token
// ===========================================================================================

async function handlerRefresh(req: Request, res: Response) {
  const token = getBearerToken(req);

  const refreshToken = await getUserFromRefreshToken(token);

  if (!refreshToken) {
    res.status(401).json({
      error: "Invalid refresh token",
    });
    return;
  }

  if (refreshToken.revokedAt) {
    res.status(401).json({
      error: "Invalid refresh token",
    });
    return;
  }

  if (refreshToken.expiresAt <= new Date()) {
    res.status(401).json({
      error: "Invalid refresh token",
    });
    return;
  }

  const accessToken = makeJWT(refreshToken.userId, 3600, config.api.jwtSecret);

  res.status(200).json({
    token: accessToken,
  });
}
// ===========================================================================================
// handelr Revoke
// ===========================================================================================

async function handlerRevoke(req: Request, res: Response) {
  const token = getBearerToken(req);

  await revokeRefreshToken(token);

  res.status(204).send();
}

// ===========================================================================================
// Login User Handler
// ===========================================================================================
async function handlerLogin(req: Request, res: Response) {
  type parameters = {
    email: string;
    password: string;
  };

  const params: parameters = req.body;

  if (typeof params.email !== "string" || typeof params.password !== "string") {
    res.status(401).json({
      error: "incorrect email or password",
    });
    return;
  }

  const user = await getUserByEmail(params.email);

  if (!user) {
    res.status(401).json({
      error: "incorrect email or password",
    });
    return;
  }

  const valid = await checkPasswordHash(params.password, user.hashedPassword);

  if (!valid) {
    res.status(401).json({
      error: "incorrect email or password",
    });
    return;
  }

  const token = makeJWT(user.id, 3600, config.api.jwtSecret);

  const refreshToken = makeRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 60);

  await db.insert(refreshTokens).values({
    token: refreshToken,
    userId: user.id,
    expiresAt,
  });

  res.status(200).json({
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
    isChirpyRed: user.isChirpyRed,
    token,
    refreshToken,
  });
}

// ===========================================================================================
// Create User Handler
// ===========================================================================================

async function handlerCreateUser(req: Request, res: Response) {
  type parameters = {
    email: string;
    password: string;
  };

  const params: parameters = req.body;

  if (typeof params.email !== "string" || typeof params.password !== "string") {
    res.status(400).json({
      error: "Invalid request body",
    });
    return;
  }

  const hashedPassword = await hashPassword(params.password);

  const user = await createUser({
    email: params.email,
    hashedPassword,
  });

  res.status(201).json({
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
    email: user.email,
  });
}

// ===========================================================================================
// Web Hook
// ===========================================================================================

// ===========================================================================================
async function handlerPolkaWebhook(req: Request, res: Response) {
  let apiKey: string;

  try {
    apiKey = getAPIKey(req);
  } catch {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  if (apiKey !== config.api.polkaKey) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  type parameters = {
    event: string;
    data: {
      userId: string;
    };
  };

  const params: parameters = req.body;

  if (params.event !== "user.upgraded") {
    res.status(204).send();
    return;
  }

  const user = await upgradeUserToChirpyRed(params.data.userId);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(204).send();
}
// ===========================================================================================
// Reset Handler
async function handlerReset(_req: Request, res: Response) {
  if (config.api.platform !== "dev") {
    res.status(403).json({
      error: "Forbidden",
    });

    return;
  }

  await deleteAllUsers();

  config.api.fileserverHits = 0;

  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("Hits reset to 0");
}

// ===========================================================================================
// Register Middlewares
// ===========================================================================================

app.use(middlewareLogResponses);

// ===========================================================================================
// Register Routes
// ===========================================================================================

app.get("/api/healthz", handlerReadiness);

app.get("/admin/metrics", handlerMetrics);

app.post("/admin/reset", handlerReset);

app.post("/api/validate_chirp", handlerValidateChirp);

app.post("/api/users", handlerCreateUser);

app.put("/api/users", handlerUpdateUser);

app.post("/api/chirps", handlerCreateChirp);

app.get("/api/chirps", handlerGetChirps);

app.get("/api/chirps/:chirpId", handlerGetChirp);

app.post("/api/login", handlerLogin);

app.post("/api/refresh", handlerRefresh);

app.post("/api/revoke", handlerRevoke);

app.delete("/api/chirps/:chirpId", handlerDeleteChirp);

app.post("/api/polka/webhooks", handlerPolkaWebhook);

// ===========================================================================================
// Static Files
// ===========================================================================================

app.use("/app", middlewareMetricsInc, express.static("./src/app"));

// ===========================================================================================
// Error Handler Middleware
// ===========================================================================================

app.use(errorHandler);

// ===========================================================================================
// Start Server
// ===========================================================================================

app.listen(config.api.port, () => {
  console.log(`Server is running at http://localhost:${config.api.port}`);
});
