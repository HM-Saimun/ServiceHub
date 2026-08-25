const { clerkClient, getAuth } = require("@clerk/express");
const db = require("../database/db");

const isClerkConfigured = () =>
  Boolean(process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

const getUserByClerkId = (clerkUserId) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE clerk_user_id = ?`,
      [clerkUserId],
      (err, row) => (err ? reject(err) : resolve(row)),
    );
  });

const upsertLocalUser = (clerkUser) =>
  new Promise((resolve, reject) => {
    const email = clerkUser.primaryEmailAddress?.emailAddress || null;
    const emailVerified = clerkUser.primaryEmailAddress?.verification?.status === "verified" ? 1 : 0;
    const name =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      email ||
      "ServiceHub user";

    db.serialize(() => {
      if (email) {
        db.run(
          `UPDATE users
           SET clerk_user_id = ?, name = ?, email_verified = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
           WHERE email = ? AND (clerk_user_id IS NULL OR clerk_user_id = '')`,
          [clerkUser.id, name, emailVerified, clerkUser.imageUrl || null, email],
        );
      }

      db.run(
        `INSERT INTO users (
          clerk_user_id, name, email, email_verified, image_url, role, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(clerk_user_id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          email_verified = excluded.email_verified,
          image_url = excluded.image_url,
          updated_at = CURRENT_TIMESTAMP`,
        [clerkUser.id, name, email, emailVerified, clerkUser.imageUrl || null],
        function (err) {
          if (err) return reject(err);
          getUserByClerkId(clerkUser.id).then(resolve).catch(reject);
        },
      );
    });
  });

const requireManagedAuth = async (req, res, next) => {
  if (!isClerkConfigured()) {
    return res.status(503).json({
      error:
        "Managed authentication is not configured. Add Clerk keys to your .env file.",
    });
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const localUser = await upsertLocalUser(clerkUser);

    req.userId = userId;
    req.localUser = localUser;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  isClerkConfigured,
  requireManagedAuth,
  upsertLocalUser,
};
