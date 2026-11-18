/**
 * ServiceHub Provider App - Dashboard Module
 * Handles dashboard statistics, bookings, and earnings display
 */

class ProviderDashboard {
    constructor() {
        this.stats = null;
        this.bookings = [];
        this.earnings = null;
        this.ratings = null;
        this.init();
    }

    /**
     * Initialize dashboard
     */
    init() {
        this.loadDashboard();
    }

    /**
     * Load all dashboard data
     */
    async loadDashboard() {
        try {
            // Show loading state
            this.showLoadingState();

            // Fetch all dashboard data in parallel
            const [stats, bookings, earnings, ratings] = await Promise.all([
                this.fetchStats(),
                this.fetchBookings(),
                this.fetchEarnings(),
                this.fetchRatings(),
            ]);

            this.stats = stats;
            this.bookings = bookings;
            this.earnings = earnings;
            this.ratings = ratings;

            // Render dashboard
            this.render();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    /**
     * Fetch provider statistics
     */
    async fetchStats() {
        try {
            const response = await providerAuth.fetchAPI('/stats');
            return response;
        } catch (error) {
            // Return mock data for development
            return {
                completed_jobs: 24,
                average_rating: 4.8,
                total_reviews: 18,
                active_bookings: 3,
                monthly_earnings: 2500.00,
            };
        }
    }

    /**
     * Fetch recent bookings
     */
    async fetchBookings(limit = 5) {
        try {
            const response = await providerAuth.fetchAPI(`/bookings?status=pending,accepted,in_progress`);
            return response.bookings?.slice(0, limit) || [];
        } catch (error) {
            // Return mock data
            return [
                {
                    id: 1,
                    user_name: 'John Doe',
                    service_address: '123 Main St, New York',
                    date: '2024-09-05',
                    time: '10:00 AM',
                    work_details: 'Fix leaky faucet in kitchen',
                    status: 'pending',
                },
                {
                    id: 2,
                    user_name: 'Jane Smith',
                    service_address: '456 Oak Ave, New York',
                    date: '2024-09-06',
                    time: '2:00 PM',
                    work_details: 'Paint bedroom walls',
                    status: 'accepted',
                },
                {
                    id: 3,
                    user_name: 'Mike Johnson',
                    service_address: '789 Pine Rd, New York',
                    date: '2024-09-07',
                    time: '9:00 AM',
                    work_details: 'Install ceiling fan',
                    status: 'in_progress',
                },
            ];
        }
    }

    /**
     * Fetch earnings data
     */
    async fetchEarnings() {
        try {
            const response = await providerAuth.fetchAPI('/earnings?period=month');
            return response;
        } catch (error) {
            // Return mock data
            return {
                summary: {
                    total_earnings: 2500.00,
                    transaction_count: 8,
                },
                breakdown: [
                    { status: 'completed', amount: 2500.00, count: 8 },
                    { status: 'pending', amount: 350.00, count: 1 },
                ],
            };
        }
    }

    /**
     * Fetch ratings
     */
    async fetchRatings(limit = 3) {
        try {
            const response = await providerAuth.fetchAPI('/ratings');
            return {
                average_rating: response.average_rating || 0,
                total_ratings: response.total_ratings || 0,
                ratings: response.ratings?.slice(0, limit) || [],
            };
        } catch (error) {
            // Return mock data
            return {
                average_rating: 4.8,
                total_ratings: 18,
                ratings: [
                    {
                        id: 1,
                        customer_name: 'Sarah Wilson',
                        rating: 5,
                        review_text: 'Excellent work! Very professional and on time.',
                    },
                    {
                        id: 2,
                        customer_name: 'Robert Brown',
                        rating: 5,
                        review_text: 'Great service, highly recommended!',
                    },
                    {
                        id: 3,
                        customer_name: 'Emily Davis',
                        rating: 4,
                        review_text: 'Good work, could improve response time.',
                    },
                ],
            };
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const dashboardEl = document.getElementById('dashboard');
        if (dashboardEl) {
            dashboardEl.innerHTML = `
                <div class="text-center p-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Loading your dashboard...</p>
                </div>
            `;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const dashboardEl = document.getElementById('dashboard');
        if (dashboardEl) {
            dashboardEl.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    ${message}
                </div>
            `;
        }
    }

    /**
     * Render dashboard
     */
    render() {
        const dashboardEl = document.getElementById('dashboard');
        if (!dashboardEl) return;

        dashboardEl.innerHTML = `
            <!-- Welcome Section -->
            <div class="row mb-4">
                <div class="col-lg-8">
                    <div class="card welcome-card">
                        <div class="card-body">
                            <h3 class="mb-2">Welcome back, ${providerAuth.user?.name || 'Provider'}! 👋</h3>
                            <p class="text-muted mb-0">You have <strong>${this.stats.active_bookings}</strong> active bookings and earned <strong>$${this.formatCurrency(this.stats.monthly_earnings)}</strong> this month.</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card quick-actions">
                        <div class="card-body">
                            <h5 class="mb-3">Quick Actions</h5>
                            <div class="d-grid gap-2">
                                <button class="btn btn-sm btn-primary" onclick="navigateTo('bookings')">
                                    <i class="fas fa-calendar-check"></i> View Bookings
                                </button>
                                <button class="btn btn-sm btn-outline" onclick="navigateTo('profile')">
                                    <i class="fas fa-user"></i> Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="row mb-4">
                ${this.renderStatCard('Completed Jobs', this.stats.completed_jobs, 'fas fa-check-circle', 'success')}
                ${this.renderStatCard('Active Bookings', this.stats.active_bookings, 'fas fa-hourglass-start', 'warning')}
                ${this.renderStatCard('Average Rating', `${this.stats.average_rating}/5`, 'fas fa-star', 'info')}
                ${this.renderStatCard('This Month Earnings', `$${this.formatCurrency(this.stats.monthly_earnings)}`, 'fas fa-wallet', 'primary')}
            </div>

            <!-- Main Content Grid -->
            <div class="row">
                <!-- Recent Bookings -->
                <div class="col-lg-8 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0"><i class="fas fa-list"></i> Recent Bookings</h5>
                                <a href="#" onclick="navigateTo('bookings')" class="btn btn-sm btn-outline">View All</a>
                            </div>
                        </div>
                        <div class="card-body">
                            ${this.renderBookingsList()}
                        </div>
                    </div>
                </div>

                <!-- Earnings Summary -->
                <div class="col-lg-4 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-chart-line"></i> This Month</h5>
                        </div>
                        <div class="card-body">
                            <div class="earning-summary">
                                <div class="earning-item mb-3">
                                    <span class="text-muted">Total Earnings</span>
                                    <h4 class="text-success">$${this.formatCurrency(this.earnings.summary.total_earnings)}</h4>
                                </div>
                                <div class="earning-item">
                                    <span class="text-muted">Completed Jobs</span>
                                    <h4 class="text-primary">${this.earnings.summary.transaction_count}</h4>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-primary w-100 mt-3" onclick="navigateTo('earnings')">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ratings Section -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0"><i class="fas fa-comments"></i> Recent Reviews</h5>
                                <span class="badge badge-info">${this.ratings.average_rating}/5 ⭐</span>
                            </div>
                        </div>
                        <div class="card-body">
                            ${this.renderRatingsList()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render stat card
     */
    renderStatCard(label, value, icon, color) {
        return `
            <div class="col-md-6 col-lg-3 mb-3">
                <div class="card stat-card stat-card-${color}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="text-muted mb-2">${label}</h6>
                                <h3 class="mb-0">${value}</h3>
                            </div>
                            <div class="stat-icon">
                                <i class="${icon}"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render bookings list
     */
    renderBookingsList() {
        if (this.bookings.length === 0) {
            return `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-inbox" style="font-size: 32px; opacity: 0.5;"></i>
                    <p class="mt-2">No active bookings yet</p>
                </div>
            `;
        }

        return `
            <div class="bookings-list">
                ${this.bookings.map(booking => `
                    <div class="booking-item">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="mb-1">${booking.user_name}</h6>
                                <small class="text-muted">${booking.service_address}</small>
                            </div>
                            <span class="badge badge-${this.getStatusColor(booking.status)}">
                                ${this.formatStatus(booking.status)}
                            </span>
                        </div>
                        <p class="mb-2"><i class="fas fa-briefcase"></i> ${booking.work_details}</p>
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i> ${booking.date} at ${booking.time}
                        </small>
                        <div class="mt-2">
                            <button class="btn btn-xs btn-primary" onclick="viewBookingDetail(${booking.id})">
                                View Details
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render ratings list
     */
    renderRatingsList() {
        if (this.ratings.ratings.length === 0) {
            return `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-star" style="font-size: 32px; opacity: 0.5;"></i>
                    <p class="mt-2">No reviews yet</p>
                </div>
            `;
        }

        return `
            <div class="ratings-list">
                ${this.ratings.ratings.map(rating => `
                    <div class="rating-item">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <strong>${rating.customer_name}</strong>
                            <span class="rating-stars">
                                ${'⭐'.repeat(rating.rating)}<span class="text-muted">${rating.rating}/5</span>
                            </span>
                        </div>
                        <p class="mb-0 text-muted">${rating.review_text}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get status badge color
     */
    getStatusColor(status) {
        const colors = {
            pending: 'warning',
            accepted: 'info',
            in_progress: 'primary',
            completed: 'success',
            rejected: 'danger',
        };
        return colors[status] || 'secondary';
    }

    /**
     * Format status text
     */
    formatStatus(status) {
        return status.replace(/_/g, ' ').toUpperCase();
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return parseFloat(amount).toFixed(2);
    }

    /**
     * Refresh dashboard
     */
    refresh() {
        this.loadDashboard();
    }
}

// Initialize dashboard when page loads
let providerDashboard;
document.addEventListener('DOMContentLoaded', () => {
    if (providerAuth.isAuthenticated) {
        providerDashboard = new ProviderDashboard();
    }
});

/**
 * View booking detail
 */
function viewBookingDetail(bookingId) {
    console.log('Viewing booking:', bookingId);
    navigateTo('bookings');
}

/**
 * Refresh dashboard manually
 */
function refreshDashboard() {
    if (providerDashboard) {
        providerDashboard.refresh();
    }
}
