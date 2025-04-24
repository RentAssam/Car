// Configuration
const CONFIG = {
    scriptUrl: 'https://script.google.com/macros/s/AKfycbypFHPwmX1aaIHcsmOYlVSIFHwcz7QVG7JpB-TNtpOD8NkS6g8u5rr-vX5Xe92bBNW4/exec', // Replace with your Google Apps Script URL
    defaultCurrency: '₹'
};

// State Management
const AppState = {
    currentUser: null,
    vehicles: [],
    bookings: [],
    currentVehicle: null
};

// DOM Elements
const DOM = {
    vehicleList: document.getElementById('vehicleList'),
    searchInput: document.getElementById('searchInput'),
    authBtn: document.getElementById('authBtn'),
    bookingsList: document.getElementById('bookingsList'),
    userBookings: document.getElementById('userBookings')
};

// Initialize Application
async function init() {
    await loadVehicles();
    checkAuthState();
    setupEventListeners();
}

// API Functions
async function fetchData(action, params = {}) {
    try {
        const url = new URL(CONFIG.scriptUrl);
        url.searchParams.append('action', action);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(`API Error (${action}):`, error);
        throw error;
    }
}

// Vehicle Functions
async function loadVehicles() {
    try {
        const data = await fetchData('getVehicles');
        AppState.vehicles = data;
        renderVehicles(data);
    } catch (error) {
        showAlert('Failed to load vehicles', 'danger');
    }
}

function renderVehicles(vehicles) {
    DOM.vehicleList.innerHTML = vehicles.map(vehicle => `
        <div class="col-md-4 mb-4">
            <div class="card vehicle-card h-100">
                <img src="${vehicle.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     class="card-img-top" alt="${vehicle.model}">
                <div class="card-body">
                    <h5 class="card-title">${vehicle.brand} ${vehicle.model}</h5>
                    <p class="card-text">
                        <i class="fas fa-calendar-alt me-1"></i> ${vehicle.year}<br>
                        <i class="fas fa-tag me-1"></i> ${CONFIG.defaultCurrency}${vehicle.dailyRate}/day
                    </p>
                    <button class="btn btn-primary w-100" onclick="showBookingModal('${vehicle.id}')">
                        <i class="fas fa-calendar-check me-1"></i> Book Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Booking Functions
function showBookingModal(vehicleId) {
    AppState.currentVehicle = AppState.vehicles.find(v => v.id === vehicleId);
    document.getElementById('vehicleId').value = vehicleId;
    
    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    document.getElementById('startDate').valueAsDate = today;
    document.getElementById('endDate').valueAsDate = tomorrow;
    updateCostEstimate();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

function updateCostEstimate() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate && endDate && AppState.currentVehicle) {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const totalCost = diffDays * AppState.currentVehicle.dailyRate;
        
        document.getElementById('estimatedCost').textContent = 
            `${CONFIG.defaultCurrency}${totalCost.toFixed(2)} (${diffDays} days)`;
    }
}

async function submitBooking() {
    const bookingData = {
        vehicleId: document.getElementById('vehicleId').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        totalCost: document.getElementById('estimatedCost').textContent.replace(/\D/g, '')
    };
    
    try {
        const response = await fetch(CONFIG.scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'createBooking',
                ...bookingData,
                userId: AppState.currentUser?.id || 'guest'
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showAlert(`Booking confirmed! ID: ${result.bookingId}`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
            await loadVehicles();
        }
    } catch (error) {
        console.error('Booking failed:', error);
        showAlert('Booking failed. Please try again.', 'danger');
    }
}

// Auth Functions
function checkAuthState() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    AppState.currentUser = user;
    
    if (user) {
        DOM.authBtn.innerHTML = `<i class="fas fa-user me-1"></i> ${user.name}`;
        DOM.authBtn.onclick = showUserProfile;
        loadUserBookings();
    } else {
        DOM.authBtn.innerHTML = '<i class="fas fa-user me-1"></i> Login';
        DOM.authBtn.onclick = showAuthModal;
    }
}

function showAuthModal() {
    isLoginMode = true;
    updateAuthUI();
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    modal.show();
}

// Helper Functions
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container');
    container.prepend(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function setupEventListeners() {
    document.getElementById('startDate').addEventListener('change', updateCostEstimate);
    document.getElementById('endDate').addEventListener('change', updateCostEstimate);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
