/**
 * ServiceHub Provider App - Main Authentication & Session Manager
 * Handles all authentication logic and session management
 */

class ProviderAuth {
    constructor() {
        this.apiBaseUrl = '/api/provider';
        this.user = null;
        this.isAuthenticated = false;
        this.init();
    }

    /**
     * Initialize auth system
     */
    init() {
        this.checkAuthStatus();
        this.setupAuthInterceptor();
    }

    /**
     * Check if user is authenticated
     */
    checkAuthStatus() {
        const token = this.getAuthToken();
        const email = localStorage.getItem('providerEmail');
        const authenticated = localStorage.getItem('providerAuthenticated');

        if (token && email && authenticated === 'true') {
            this.isAuthenticated = true;
            this.user = {
                email: email,
                name: localStorage.getItem('providerName'),
                phone: localStorage.getItem('providerPhone'),
                id: localStorage.getItem('providerUserId'),
            };
            return true;
        } else {
            this.redirectToLogin();
            return false;
        }
    }

    /**
     * Get auth token from storage
     */
    getAuthToken() {
        return localStorage.getItem('providerAuthToken');
    }

    /**
     * Set auth token
     */
    setAuthToken(token) {
        localStorage.setItem('providerAuthToken', token);
    }

    /**
     * Setup fetch interceptor to add auth headers
     */
    setupAuthInterceptor() {
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            return originalFetch.apply(this, args).then(response => {
                // If 401, redirect to login
                if (response.status === 401) {
                    this.logout();
                    window.location.href = '/provider-app/pages/login.html';
                }
                return response;
            });
        };
    }

    /**
     * Make authenticated API call
     */
    async fetchAPI(endpoint, options = {}) {
        const token = this.getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                ...options,
                headers,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Login provider
     */
    async login(email, password) {
        try {
            // TODO: Replace with actual API endpoint once backend is ready
            // For now, using localStorage simulation
            if (email && password.length >= 8) {
                this.user = {
                    email: email,
                    id: 'temp-id-' + Date.now(),
                };
                
                localStorage.setItem('providerEmail', email);
                localStorage.setItem('providerAuthenticated', 'true');
                localStorage.setItem('providerAuthToken', 'temp-token-' + Date.now());
                
                this.isAuthenticated = true;
                return { success: true, user: this.user };
            }
            throw new Error('Invalid credentials');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Register new provider
     */
    async register(data) {
        try {
            // TODO: Replace with actual API endpoint
            const { name, email, phone, password } = data;
            
            if (!name || !email || !phone || !password) {
                throw new Error('Missing required fields');
            }

            this.user = {
                name: name,
                email: email,
                phone: phone,
                id: 'temp-id-' + Date.now(),
            };

            localStorage.setItem('providerName', name);
            localStorage.setItem('providerEmail', email);
            localStorage.setItem('providerPhone', phone);
            localStorage.setItem('providerAuthenticated', 'true');
            localStorage.setItem('providerAuthToken', 'temp-token-' + Date.now());

            this.isAuthenticated = true;
            return { success: true, user: this.user };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Logout provider
     */
    logout() {
        localStorage.removeItem('providerEmail');
        localStorage.removeItem('providerName');
        localStorage.removeItem('providerPhone');
        localStorage.removeItem('providerUserId');
        localStorage.removeItem('providerAuthenticated');
        localStorage.removeItem('providerAuthToken');
        localStorage.removeItem('rememberProvider');
        
        this.isAuthenticated = false;
        this.user = null;
    }

    /**
     * Redirect to login if not authenticated
     */
    redirectToLogin() {
        if (!this.isAuthenticated && window.location.pathname !== '/provider-app/pages/login.html') {
            window.location.href = '/provider-app/pages/login.html';
        }
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        try {
            const response = await this.fetchAPI('/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user profile
     */
    async getProfile() {
        try {
            const response = await this.fetchAPI('/profile');
            return response;
        } catch (error) {
            throw error;
        }
    }
}

// Initialize auth on page load
const providerAuth = new ProviderAuth();

/**
 * Utility function to show notifications
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notificationEl = document.createElement('div');
    notificationEl.className = `alert alert-${type} position-fixed`;
    notificationEl.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    notificationEl.innerHTML = `
        <i class="fas fa-${type === 'danger' ? 'exclamation-circle' : 'check-circle'}"></i>
        ${message}
    `;

    document.body.appendChild(notificationEl);

    setTimeout(() => {
        notificationEl.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notificationEl.remove(), 300);
    }, duration);
}

/**
 * Utility function to load page sections
 */
async function loadPageSection(sectionName) {
    try {
        const response = await fetch(`/provider-app/pages/${sectionName}.html`);
        if (!response.ok) throw new Error('Failed to load section');
        return await response.text();
    } catch (error) {
        console.error('Error loading section:', error);
        return '<div class="alert alert-danger">Failed to load section</div>';
    }
}

/**
 * Utility function to check authentication before accessing pages
 */
function requireAuth() {
    if (!providerAuth.isAuthenticated) {
        showNotification('Please log in first', 'danger');
        window.location.href = '/provider-app/pages/login.html';
    }
}

/**
 * Animation styles for notifications
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    .alert {
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        border: none;
    }

    .alert-success {
        background: #d4edda;
        color: #155724;
    }

    .alert-danger {
        background: #f8d7da;
        color: #721c24;
    }

    .alert-info {
        background: #d1ecf1;
        color: #0c5460;
    }

    .alert-warning {
        background: #fff3cd;
        color: #856404;
    }
`;
document.head.appendChild(style);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProviderAuth, showNotification, loadPageSection, requireAuth };
}
