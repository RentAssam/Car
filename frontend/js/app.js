// Configuration
const CONFIG = {
    scriptUrl: 'https://script.google.com/macros/s/AKfycbyMVYRkDmrDjdrc3W0ILw5tZA48aqHfnS8kWpKR-4n5VTvYZ213qdNNC_4iJRlibvjt/exec',
    defaultCurrency: 'Rs.'
};

// State Management
const AppState = {
    currentUser: null,
    vehicles: [],
    bookings: []
};

// DOM Elements
const DOM = {
    vehicleList: document.getElementById('vehicleList'),
    searchInput: document.getElementById('searchInput'),
    authBtn: document.getElementById('authBtn')
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
                <img src="${vehicle.imageUrl || 'https://via.placeholder.com/300'}" 
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 
