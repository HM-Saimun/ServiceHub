const db = require("../database/db");
const { promisify } = require("util");

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

// ==================== PROFILE MANAGEMENT ====================

/**
 * Get provider profile details
 */
exports.getProviderProfile = (req, res) => {
  const userId = req.user?.id;
  const clerkUserId = req.user?.clerk_user_id;

  if (!userId && !clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = userId
    ? `SELECT * FROM provider_details WHERE user_id = ?`
    : `SELECT * FROM provider_details WHERE clerk_user_id = ?`;
  
  const param = userId || clerkUserId;

  db.get(query, [param], (err, profile) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    if (!profile) {
      return res.status(404).json({ error: "Provider profile not found" });
    }

    // Parse JSON fields
    const response = {
      ...profile,
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      service_categories: profile.service_categories ? JSON.parse(profile.service_categories) : [],
      certifications: profile.certifications ? JSON.parse(profile.certifications) : [],
    };

    res.json(response);
  });
};

/**
 * Create or update provider profile
 */
exports.updateProviderProfile = (req, res) => {
  const userId = req.user?.id;
  const clerkUserId = req.user?.clerk_user_id;

  if (!userId && !clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    skills,
    hourly_rate,
    bio,
    certifications,
    years_experience,
    profile_image_url,
    service_categories,
  } = req.body;

  // Validate inputs
  if (hourly_rate && (typeof hourly_rate !== "number" || hourly_rate < 0)) {
    return res.status(400).json({ error: "Invalid hourly rate" });
  }

  if (years_experience && typeof years_experience !== "number") {
    return res.status(400).json({ error: "Invalid years of experience" });
  }

  const skillsJson = skills ? JSON.stringify(skills) : null;
  const categoriesJson = service_categories ? JSON.stringify(service_categories) : null;
  const certificationsJson = certifications ? JSON.stringify(certifications) : null;

  // Insert or update
  const insertQuery = `
    INSERT INTO provider_details (
      user_id, clerk_user_id, skills, hourly_rate, bio, 
      certifications, years_experience, profile_image_url, 
      service_categories, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      skills = excluded.skills,
      hourly_rate = excluded.hourly_rate,
      bio = excluded.bio,
      certifications = excluded.certifications,
      years_experience = excluded.years_experience,
      profile_image_url = excluded.profile_image_url,
      service_categories = excluded.service_categories,
      updated_at = CURRENT_TIMESTAMP
  `;

  db.run(
    insertQuery,
    [userId, clerkUserId, skillsJson, hourly_rate, bio, certificationsJson, years_experience, profile_image_url, categoriesJson],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to update profile", details: err.message });
      }

      // Fetch and return updated profile
      const selectQuery = userId
        ? `SELECT * FROM provider_details WHERE user_id = ?`
        : `SELECT * FROM provider_details WHERE clerk_user_id = ?`;

      db.get(selectQuery, [userId || clerkUserId], (err, profile) => {
        if (err) {
          return res.status(500).json({ error: "Failed to fetch updated profile" });
        }

        const response = {
          ...profile,
          skills: profile.skills ? JSON.parse(profile.skills) : [],
          service_categories: profile.service_categories ? JSON.parse(profile.service_categories) : [],
          certifications: profile.certifications ? JSON.parse(profile.certifications) : [],
        };

        res.status(201).json({
          message: "Provider profile updated successfully",
          profile: response,
        });
      });
    }
  );
};

// ==================== BOOKINGS MANAGEMENT ====================

/**
 * Get all bookings assigned to provider
 */
exports.getProviderBookings = (req, res) => {
  const userId = req.user?.id;
  const { status } = req.query; // Optional filter by status

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let query = `
    SELECT b.*, u.name as customer_name, u.email as customer_email
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.provider_id = ?
  `;

  const params = [userId];

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY b.created_at DESC`;

  db.all(query, params, (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    res.json({
      count: bookings.length,
      bookings: bookings || [],
    });
  });
};

/**
 * Update booking status (accept, reject, complete, etc.)
 */
exports.updateBookingStatus = (req, res) => {
  const userId = req.user?.id;
  const { bookingId } = req.params;
  const { status, notes } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const validStatuses = ["pending", "accepted", "rejected", "in_progress", "completed", "cancelled"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  // Verify provider owns this booking
  db.get(
    `SELECT id FROM bookings WHERE id = ? AND provider_id = ?`,
    [bookingId, userId],
    (err, booking) => {
      if (err || !booking) {
        return res.status(404).json({ error: "Booking not found or unauthorized" });
      }

      db.run(
        `UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, bookingId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Failed to update booking" });
          }

          res.json({
            message: "Booking status updated successfully",
            bookingId,
            newStatus: status,
          });
        }
      );
    }
  );
};

// ==================== EARNINGS TRACKING ====================

/**
 * Get provider earnings summary
 */
exports.getEarnings = (req, res) => {
  const userId = req.user?.id;
  const { period } = req.query; // 'week', 'month', 'year', or 'all'

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let dateFilter = "";
  if (period === "week") {
    dateFilter = ` AND date(transaction_date) >= date('now', '-7 days')`;
  } else if (period === "month") {
    dateFilter = ` AND date(transaction_date) >= date('now', '-30 days')`;
  } else if (period === "year") {
    dateFilter = ` AND date(transaction_date) >= date('now', '-365 days')`;
  }

  // Get total earnings
  db.get(
    `SELECT SUM(amount) as total_earnings, COUNT(*) as transaction_count
     FROM provider_earnings 
     WHERE provider_id = ? AND status = 'completed' ${dateFilter}`,
    [userId],
    (err, summary) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      // Get earnings breakdown by status
      db.all(
        `SELECT status, SUM(amount) as amount, COUNT(*) as count
         FROM provider_earnings
         WHERE provider_id = ? ${dateFilter}
         GROUP BY status`,
        [userId],
        (err, breakdown) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          res.json({
            summary: {
              total_earnings: summary.total_earnings || 0,
              transaction_count: summary.transaction_count || 0,
            },
            breakdown: breakdown || [],
          });
        }
      );
    }
  );
};

/**
 * Get detailed earnings history
 */
exports.getEarningsHistory = (req, res) => {
  const userId = req.user?.id;
  const { limit = 50, offset = 0 } = req.query;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  db.all(
    `SELECT pe.*, b.work_details, u.name as customer_name
     FROM provider_earnings pe
     LEFT JOIN bookings b ON pe.booking_id = b.id
     LEFT JOIN users u ON b.user_id = u.id
     WHERE pe.provider_id = ?
     ORDER BY pe.transaction_date DESC
     LIMIT ? OFFSET ?`,
    [userId, parseInt(limit), parseInt(offset)],
    (err, history) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      res.json({
        history: history || [],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    }
  );
};

// ==================== AVAILABILITY/SCHEDULE ====================

/**
 * Get provider availability schedule
 */
exports.getAvailability = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  db.all(
    `SELECT * FROM provider_availability 
     WHERE provider_id = ? 
     ORDER BY 
       CASE day_of_week 
         WHEN 'Monday' THEN 1
         WHEN 'Tuesday' THEN 2
         WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4
         WHEN 'Friday' THEN 5
         WHEN 'Saturday' THEN 6
         WHEN 'Sunday' THEN 7
       END`,
    [userId],
    (err, schedule) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      res.json({ schedule: schedule || [] });
    }
  );
};

/**
 * Update provider availability for a specific day
 */
exports.updateAvailability = (req, res) => {
  const userId = req.user?.id;
  const { day_of_week, start_time, end_time, is_available } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  if (!validDays.includes(day_of_week)) {
    return res.status(400).json({ error: "Invalid day of week" });
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
    return res.status(400).json({ error: "Invalid time format (use HH:MM)" });
  }

  db.run(
    `INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(provider_id, day_of_week) DO UPDATE SET
       start_time = excluded.start_time,
       end_time = excluded.end_time,
       is_available = excluded.is_available`,
    [userId, day_of_week, start_time, end_time, is_available ? 1 : 0],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to update availability" });
      }

      res.json({
        message: "Availability updated successfully",
        day: day_of_week,
        start_time,
        end_time,
        is_available,
      });
    }
  );
};

// ==================== RATINGS & REVIEWS ====================

/**
 * Get provider ratings and reviews
 */
exports.getProviderRatings = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  db.all(
    `SELECT pr.*, u.name as customer_name, u.image_url as customer_image
     FROM provider_ratings pr
     LEFT JOIN users u ON pr.customer_id = u.id
     WHERE pr.provider_id = ?
     ORDER BY pr.created_at DESC`,
    [userId],
    (err, ratings) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      // Calculate average rating
      const avgRating =
        ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
          : 0;

      res.json({
        average_rating: parseFloat(avgRating),
        total_ratings: ratings.length,
        ratings: ratings || [],
      });
    }
  );
};

// ==================== PROVIDER STATISTICS ====================

/**
 * Get provider dashboard statistics
 */
exports.getProviderStats = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get provider details
  db.get(
    `SELECT completed_jobs, total_rating, total_reviews FROM provider_details WHERE user_id = ?`,
    [userId],
    (err, details) => {
      if (err || !details) {
        return res.status(500).json({ error: "Failed to fetch provider stats" });
      }

      // Get active bookings count
      db.get(
        `SELECT COUNT(*) as active_count FROM bookings 
         WHERE provider_id = ? AND status IN ('pending', 'accepted', 'in_progress')`,
        [userId],
        (err, activeBookings) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          // Get this month's earnings
          db.get(
            `SELECT SUM(amount) as monthly_earnings FROM provider_earnings 
             WHERE provider_id = ? AND status = 'completed'
             AND date(transaction_date) >= date('now', 'start of month')`,
            [userId],
            (err, earnings) => {
              if (err) {
                return res.status(500).json({ error: "Database error" });
              }

              res.json({
                completed_jobs: details.completed_jobs || 0,
                average_rating: details.total_rating || 0,
                total_reviews: details.total_reviews || 0,
                active_bookings: activeBookings.active_count || 0,
                monthly_earnings: earnings.monthly_earnings || 0,
              });
            }
          );
        }
      );
    }
  );
};
