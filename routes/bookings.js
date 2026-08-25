const express = require("express");
const db = require("../database/db");
const router = express.Router();
const { requireManagedAuth } = require("../middleware/managedAuth");
const {
  createBooking,
  getUserBookings,
} = require("../controllers/bookingController");

// POST: Create a booking
router.post("/create", requireManagedAuth, createBooking);

// GET: Get bookings by contact number (if needed)
router.get("/me", requireManagedAuth, getUserBookings);

module.exports = router;
  
