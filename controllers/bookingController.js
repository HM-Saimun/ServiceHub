const db = require("../database/db");

// Create a new booking
exports.createBooking = (req, res) => {
  console.log("Receive booking data: ", req.body);

  const {
    user_name,
    contact_number,
    email,
    service_address,
    date,
    time,
    work_details,
    status = "pending",
  } = req.body;

  // Validate inputs (server-side)
  // Allow normal Bangladeshi/English name punctuation, e.g. "HM. Saimun",
  // "Md. Rahman", "O'Neil", and "Mary-Jane".
  const nameRegex = /^[A-Za-z]+(?:[ .'-]+[A-Za-z]+)*\.?$/;
  const phoneRegex = /^01[3-9][0-9]{8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (typeof user_name !== "string" || !nameRegex.test(user_name.trim())) {
    return res.status(400).json({ error: "Invalid name format." });
  }

  if (!phoneRegex.test(contact_number)) {
    return res.status(400).json({ error: "Invalid Bangladeshi phone number." });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const currentDate = new Date().toISOString().split("T")[0];
  if (date < currentDate) {
    return res.status(400).json({ error: "Service date cannot be in the past." });
  }

  db.run(
    `INSERT INTO bookings (
        user_id, clerk_user_id, user_name, contact_number, email, service_address,
        date, time, work_details, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.localUser?.id || null,
      req.userId,
      user_name.trim(),
      contact_number,
      email,
      service_address,
      date,
      time,
      work_details,
      status,
    ],
    function (err) {
      if (err){
        console.error("Booking insert error for Clerk user", req.userId, ":", err.message);
        return res.status(400).json({ error: err.message });
      }
      console.log("Booking created:", { id: this.lastID, clerkUserId: req.userId });
      res.status(201).json({
        message: "Booking created successfully",
        bookingId: this.lastID,
        clerkUserId: req.userId,
      });
    }
  );
};

// (Optional) Get bookings by phone/email/etc. – if needed
exports.getUserBookings = (req, res) => {
  db.all(
    `SELECT * FROM bookings WHERE clerk_user_id = ? ORDER BY created_at DESC`,
    [req.userId],
    (err, rows) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json(rows);
    }
  );
};
