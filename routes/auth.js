const express = require("express");
const { clerkClient, getAuth } = require("@clerk/express");
const { isClerkConfigured } = require("../middleware/managedAuth");

const router = express.Router();

router.get("/config", (req, res) => {
  res.json({
    provider: "clerk",
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || "",
    configured: isClerkConfigured(),
  });
});

router.get("/me", async (req, res) => {
  if (!isClerkConfigured()) {
    return res.status(503).json({ authenticated: false, user: null });
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return res.json({ authenticated: false, user: null });
  }

  const user = await clerkClient.users.getUser(userId);

  res.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.fullName,
      email: user.primaryEmailAddress?.emailAddress,
      imageUrl: user.imageUrl,
    },
  });
});

module.exports = router;
