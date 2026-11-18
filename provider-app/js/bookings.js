/**
 * ServiceHub Provider App - Bookings Management Module
 * Handles booking list display, status updates, and actions
 */

class BookingsManager {
    constructor() {
        this.bookings = [];
        this.filteredBookings = [];
        this.selectedBooking = null;
        this.currentFilter = 'all';
        this.init();
    }

    /**
     * Initialize bookings manager
     */
    init() {
        this.loadBookings();
        this.setupEventListeners();
    }

    /**
     * Load bookings from API
     */
    async loadBookings() {
        try {
            this.showLoadingState();
            
            const response = await providerAuth.fetchAPI('/bookings');
            this.bookings = response.bookings || [];
            
            this.filterBookings(this.currentFilter);
            this.render();
        } catch (error) {
            console.error('Error loading bookings:', error);
            this.loadMockBookings();
        }
    }

    /**
     * Load mock bookings for development
     */
    loadMockBookings() {
        this.bookings = [
            {
                id: 1,
                user_name: 'John Doe',
                customer_email: 'john@example.com',
                service_address: '123 Main St, New York, NY 10001',
                date: '2024-09-05',
                time: '10:00 AM',
                work_details: 'Fix leaky faucet in kitchen and replace washer',
                status: 'pending',
                contact_number: '+1 (555) 123-4567',
                created_at: '2024-09-01',
            },
            {
                id: 2,
                user_name: 'Jane Smith',
                customer_email: 'jane@example.com',
                service_address: '456 Oak Ave, Brooklyn, NY 11201',
                date: '2024-09-06',
                time: '2:00 PM',
                work_details: 'Paint bedroom walls - 2 coats, prepare walls',
                status: 'accepted',
                contact_number: '+1 (555) 234-5678',
                created_at: '2024-09-02',
            },
            {
                id: 3,
                user_name: 'Mike Johnson',
                customer_email: 'mike@example.com',
                service_address: '789 Pine Rd, Queens, NY 11354',
                date: '2024-09-07',
                time: '9:00 AM',
                work_details: 'Install ceiling fan in living room',
                status: 'in_progress',
                contact_number: '+1 (555) 345-6789',
                created_at: '2024-09-03',
            },
            {
                id: 4,
                user_name: 'Sarah Williams',
                customer_email: 'sarah@example.com',
                service_address: '321 Elm St, Manhattan, NY 10002',
                date: '2024-09-01',
                time: '1:00 PM',
                work_details: 'Plumbing repair - replace pipes under sink',
                status: 'completed',
                contact_number: '+1 (555) 456-7890',
                created_at: '2024-08-31',
            },
            {
                id: 5,
                user_name: 'Robert Brown',
                customer_email: 'robert@example.com',
                service_address: '654 Maple Dr, Bronx, NY 10451',
                date: '2024-09-08',
                time: '11:00 AM',
                work_details: 'General home maintenance and inspection',
                status: 'pending',
                contact_number: '+1 (555) 567-8901',
                created_at: '2024-09-04',
            },
            {
                id: 6,
                user_name: 'Emily Davis',
                customer_email: 'emily@example.com',
                service_address: '987 Cedar Ln, Staten Island, NY 10301',
                date: '2024-09-04',
                time: '3:00 PM',
                work_details: 'Electrical work - install new outlet',
                status: 'rejected',
                contact_number: '+1 (555) 678-9012',
                created_at: '2024-09-02',
            },
        ];

        this.filterBookings(this.currentFilter);
        this.render();
    }

    /**
     * Filter bookings by status
     */
    filterBookings(filter) {
        this.currentFilter = filter;

        if (filter === 'all') {
            this.filteredBookings = this.bookings;
        } else {
            this.filteredBookings = this.bookings.filter(b => b.status === filter);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterBookings(filter);
                this.render();
                
                // Update active button
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const bookingsEl = document.getElementById('bookings');
        if (bookingsEl) {
            bookingsEl.innerHTML = `
                <div class="text-center p-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Loading bookings...</p>
                </div>
            `;
        }
    }

    /**
     * Render bookings page
     */
    render() {
        const bookingsEl = document.getElementById('bookings');
        if (!bookingsEl) return;

        bookingsEl.innerHTML = `
            <!-- Header -->
            <div class="bookings-header mb-4">
                <div class="row align-items-center mb-3">
                    <div class="col">
                        <h3 class="mb-0"><i class="fas fa-calendar-check"></i> Bookings Management</h3>
                        <small class="text-muted">Manage your service bookings and assignments</small>
                    </div>
                    <div class="col-auto">
                        <button class="btn btn-sm btn-primary" onclick="bookingsManager.loadBookings()">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                </div>

                <!-- Filter Buttons -->
                <div class="filter-buttons mb-4">
                    <button class="filter-btn active btn btn-sm" data-filter="all">
                        All (${this.bookings.length})
                    </button>
                    <button class="filter-btn btn btn-sm" data-filter="pending">
                        Pending (${this.bookings.filter(b => b.status === 'pending').length})
                    </button>
                    <button class="filter-btn btn btn-sm" data-filter="accepted">
                        Accepted (${this.bookings.filter(b => b.status === 'accepted').length})
                    </button>
                    <button class="filter-btn btn btn-sm" data-filter="in_progress">
                        In Progress (${this.bookings.filter(b => b.status === 'in_progress').length})
                    </button>
                    <button class="filter-btn btn btn-sm" data-filter="completed">
                        Completed (${this.bookings.filter(b => b.status === 'completed').length})
                    </button>
                </div>
            </div>

            <!-- Bookings List -->
            ${this.renderBookingsList()}

            <!-- Booking Detail Modal -->
            <div id="bookingModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Booking Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div id="modalBody" class="modal-body">
                            <!-- Content will be filled dynamically -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Render bookings list
     */
    renderBookingsList() {
        if (this.filteredBookings.length === 0) {
            return `
                <div class="empty-state p-5 text-center">
                    <i class="fas fa-inbox" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                    <h5>No bookings found</h5>
                    <p class="text-muted">You don't have any ${this.currentFilter !== 'all' ? this.currentFilter + ' ' : ''}bookings at the moment</p>
                </div>
            `;
        }

        return `
            <div class="bookings-grid">
                ${this.filteredBookings.map(booking => this.renderBookingCard(booking)).join('')}
            </div>
        `;
    }

    /**
     * Render single booking card
     */
    renderBookingCard(booking) {
        const statusColor = this.getStatusColor(booking.status);
        const statusIcon = this.getStatusIcon(booking.status);
        const isActionable = ['pending', 'accepted', 'in_progress'].includes(booking.status);

        return `
            <div class="booking-card">
                <div class="booking-card-header">
                    <div class="booking-customer">
                        <h5 class="mb-1">${booking.user_name}</h5>
                        <small class="text-muted">${booking.customer_email}</small>
                    </div>
                    <span class="badge badge-${statusColor}">
                        <i class="${statusIcon}"></i> ${this.formatStatus(booking.status)}
                    </span>
                </div>

                <div class="booking-card-body">
                    <div class="booking-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${booking.service_address}</span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${booking.date} at ${booking.time}</span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-phone"></i>
                        <span>${booking.contact_number}</span>
                    </div>
                    <div class="booking-work">
                        <strong>Work Details:</strong>
                        <p>${booking.work_details}</p>
                    </div>
                </div>

                <div class="booking-card-footer">
                    <button class="btn btn-sm btn-primary" onclick="bookingsManager.viewBookingDetail(${booking.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${isActionable ? `
                        <div class="action-buttons">
                            ${booking.status === 'pending' ? `
                                <button class="btn btn-sm btn-success" onclick="bookingsManager.updateStatus(${booking.id}, 'accepted')">
                                    <i class="fas fa-check"></i> Accept
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="bookingsManager.updateStatus(${booking.id}, 'rejected')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            ` : booking.status === 'accepted' ? `
                                <button class="btn btn-sm btn-info" onclick="bookingsManager.updateStatus(${booking.id}, 'in_progress')">
                                    <i class="fas fa-play"></i> Start Work
                                </button>
                            ` : booking.status === 'in_progress' ? `
                                <button class="btn btn-sm btn-success" onclick="bookingsManager.updateStatus(${booking.id}, 'completed')">
                                    <i class="fas fa-check-circle"></i> Mark Complete
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * View booking detail
     */
    viewBookingDetail(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        this.selectedBooking = booking;

        const modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="booking-details">
                    <!-- Customer Info -->
                    <div class="detail-section mb-4">
                        <h6 class="section-title">Customer Information</h6>
                        <div class="detail-row">
                            <span class="label">Name:</span>
                            <strong>${booking.user_name}</strong>
                        </div>
                        <div class="detail-row">
                            <span class="label">Email:</span>
                            <strong>${booking.customer_email}</strong>
                        </div>
                        <div class="detail-row">
                            <span class="label">Phone:</span>
                            <strong>${booking.contact_number}</strong>
                        </div>
                    </div>

                    <!-- Booking Info -->
                    <div class="detail-section mb-4">
                        <h6 class="section-title">Booking Information</h6>
                        <div class="detail-row">
                            <span class="label">Status:</span>
                            <span class="badge badge-${this.getStatusColor(booking.status)}">
                                ${this.formatStatus(booking.status)}
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Date & Time:</span>
                            <strong>${booking.date} at ${booking.time}</strong>
                        </div>
                        <div class="detail-row">
                            <span class="label">Location:</span>
                            <strong>${booking.service_address}</strong>
                        </div>
                        <div class="detail-row">
                            <span class="label">Booked On:</span>
                            <strong>${booking.created_at}</strong>
                        </div>
                    </div>

                    <!-- Work Details -->
                    <div class="detail-section mb-4">
                        <h6 class="section-title">Work Details</h6>
                        <p class="work-details-text">${booking.work_details}</p>
                    </div>

                    <!-- Notes Section -->
                    ${booking.status !== 'rejected' ? `
                        <div class="detail-section mb-4">
                            <h6 class="section-title">Add Notes</h6>
                            <textarea id="bookingNotes" class="form-control form-control-sm" 
                                placeholder="Add any notes or updates for this booking..."
                                rows="3"></textarea>
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="detail-actions">
                        ${booking.status === 'pending' ? `
                            <button class="btn btn-success" onclick="bookingsManager.updateStatus(${booking.id}, 'accepted')">
                                <i class="fas fa-check"></i> Accept Booking
                            </button>
                            <button class="btn btn-danger" onclick="bookingsManager.updateStatus(${booking.id}, 'rejected')">
                                <i class="fas fa-times"></i> Reject Booking
                            </button>
                        ` : booking.status === 'accepted' ? `
                            <button class="btn btn-info" onclick="bookingsManager.updateStatus(${booking.id}, 'in_progress')">
                                <i class="fas fa-play"></i> Start Work
                            </button>
                        ` : booking.status === 'in_progress' ? `
                            <button class="btn btn-success" onclick="bookingsManager.updateStatus(${booking.id}, 'completed')">
                                <i class="fas fa-check-circle"></i> Mark Complete
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            `;
        }

        // Show modal using Bootstrap
        const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();
    }

    /**
     * Update booking status
     */
    async updateStatus(bookingId, newStatus) {
        try {
            // Show confirmation
            const booking = this.bookings.find(b => b.id === bookingId);
            if (!booking) return;

            const statusText = this.formatStatus(newStatus);
            
            if (!confirm(`Update booking status to "${statusText}"?`)) {
                return;
            }

            // Call API
            const response = await providerAuth.fetchAPI(`/bookings/${bookingId}/status`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: newStatus,
                    notes: document.getElementById('bookingNotes')?.value || ''
                })
            });

            showNotification(`Booking status updated to ${statusText}`, 'success');
            
            // Update local booking
            const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
            if (bookingIndex !== -1) {
                this.bookings[bookingIndex].status = newStatus;
            }

            // Close modal if open
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
            if (modal) {
                modal.hide();
            }

            // Refresh list
            this.filterBookings(this.currentFilter);
            this.render();
        } catch (error) {
            console.error('Error updating booking:', error);
            showNotification('Failed to update booking status', 'danger');
        }
    }

    /**
     * Get status color for badge
     */
    getStatusColor(status) {
        const colors = {
            pending: 'warning',
            accepted: 'info',
            in_progress: 'primary',
            completed: 'success',
            rejected: 'danger',
            cancelled: 'secondary',
        };
        return colors[status] || 'secondary';
    }

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            pending: 'fas fa-hourglass-start',
            accepted: 'fas fa-check',
            in_progress: 'fas fa-spinner',
            completed: 'fas fa-check-circle',
            rejected: 'fas fa-times-circle',
            cancelled: 'fas fa-ban',
        };
        return icons[status] || 'fas fa-circle';
    }

    /**
     * Format status text
     */
    formatStatus(status) {
        return status.replace(/_/g, ' ').toUpperCase();
    }

    /**
     * Refresh bookings
     */
    refresh() {
        this.loadBookings();
    }
}

// Initialize bookings manager when page loads
let bookingsManager;
document.addEventListener('DOMContentLoaded', () => {
    if (providerAuth.isAuthenticated) {
        bookingsManager = new BookingsManager();
    }
});
