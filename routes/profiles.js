const express = require("express");
const router = express.Router();
const { updateProfile, getProfile } = require("../controllers/profileController");
const { requireManagedAuth } = require("../middleware/managedAuth");

// Update profile
router.put("/me", requireManagedAuth, updateProfile);

// Get profile
router.get("/me", requireManagedAuth, getProfile);

module.exports = router;
