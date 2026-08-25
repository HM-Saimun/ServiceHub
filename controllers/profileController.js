const db = require("../database/db");

// Update profile
exports.updateProfile = (req, res) => {
  const { name, phone, location } = req.body;

  db.run(
    `UPDATE users
     SET name = COALESCE(?, name),
         phone = ?,
         location = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE clerk_user_id = ?`,
    [name || null, phone || null, location || null, req.userId],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Profile updated successfully", changes: this.changes });
    }
  );
};

// Get profile
exports.getProfile = (req, res) => {
  db.get(
    `SELECT id, clerk_user_id, name, email, email_verified, image_url, phone, location, role
     FROM users
     WHERE clerk_user_id = ?`,
    [req.userId],
    (err, row) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json(row);
    }
  );
};
