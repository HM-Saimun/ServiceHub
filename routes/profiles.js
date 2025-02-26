
const express = require("express");
const db = require("../database/db");
const router = express.Router();

// Update profile
router.put("/update", (req, res) => {
  const { user_id, name, phone, location } = req.body;
  
  db.run(
    `UPDATE users SET name = ?, phone = ?, location = ? WHERE id = ?`,
    [name, phone, location, user_id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Profile updated successfully" });
    }
  );
});

// Get profile
router.get("/:userId", (req, res) => {
  const userId = req.params.userId;
  
  db.get(
    `SELECT id, name, email, phone, location FROM users WHERE id = ?`,
    [userId],
    (err, row) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json(row);
    }
  );
});

module.exports = router;
