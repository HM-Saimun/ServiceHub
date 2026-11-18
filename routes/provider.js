const express = require("express");
const router = express.Router();
const { requireManagedAuth } = require("../middleware/managedAuth");
const {
  // Profile
  getProviderProfile,
  updateProviderProfile,
  // Bookings
  getProviderBookings,
  updateBookingStatus,
  // Earnings
  getEarnings,
  getEarningsHistory,
  // Availability
  getAvailability,
  updateAvailability,
  // Ratings
  getProviderRatings,
  // Stats
  getProviderStats,
} = require("../controllers/providerController");

// ==================== PROFILE ROUTES ====================
/**
 * GET /api/provider/profile
 * Get provider's full profile details
 */
router.get("/profile", requireManagedAuth, getProviderProfile);

/**
 * PUT /api/provider/profile
 * Update provider profile details
 * Body: { skills, hourly_rate, bio, certifications, years_experience, profile_image_url, service_categories }
 */
router.put("/profile", requireManagedAuth, updateProviderProfile);

// ==================== BOOKINGS ROUTES ====================
/**
 * GET /api/provider/bookings
 * Get all bookings assigned to provider
 * Query: ?status=pending|accepted|completed
 */
router.get("/bookings", requireManagedAuth, getProviderBookings);

/**
 * PUT /api/provider/bookings/:bookingId/status
 * Update booking status
 * Body: { status: 'accepted'|'rejected'|'in_progress'|'completed', notes: '' }
 */
router.put("/bookings/:bookingId/status", requireManagedAuth, updateBookingStatus);

// ==================== EARNINGS ROUTES ====================
/**
 * GET /api/provider/earnings
 * Get earnings summary
 * Query: ?period=week|month|year|all
 */
router.get("/earnings", requireManagedAuth, getEarnings);

/**
 * GET /api/provider/earnings/history
 * Get detailed earnings transaction history
 * Query: ?limit=50&offset=0
 */
router.get("/earnings/history", requireManagedAuth, getEarningsHistory);

// ==================== AVAILABILITY ROUTES ====================
/**
 * GET /api/provider/schedule
 * Get provider's availability schedule
 */
router.get("/schedule", requireManagedAuth, getAvailability);

/**
 * PUT /api/provider/schedule
 * Update provider availability for specific day
 * Body: { day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', is_available: true }
 */
router.put("/schedule", requireManagedAuth, updateAvailability);

// ==================== RATINGS ROUTES ====================
/**
 * GET /api/provider/ratings
 * Get provider's ratings and reviews
 */
router.get("/ratings", requireManagedAuth, getProviderRatings);

// ==================== STATS ROUTES ====================
/**
 * GET /api/provider/stats
 * Get provider dashboard statistics
 */
router.get("/stats", requireManagedAuth, getProviderStats);

module.exports = router;
