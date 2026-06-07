/**
 * PWA Location-Based Ordering Guard
 * Works for Vanilla JS / HTML standard setups.
 */
alert("Location.js");
// ==========================================
// CONFIGURATION: Set your shop's details here
// ==========================================
const STORE_CONFIG = {
    latitude: 40.7128,    // Replace with your business latitude (e.g., 40.7128)
    longitude: -74.0060,  // Replace with your business longitude (e.g., -74.0060)
    radiusKm: 15,         // Your maximum delivery radius in kilometers
    bannerId: 'pwa-location-banner' // The ID of the HTML element for notices
};

// Global state tracking
let userLocationState = {
    isServiceable: false,
    hasChecked: false,
    errorMessage: ""
};

// ==========================================
// 1. DISTANCE MATHEMATICS (Haversine Formula)
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const EARTH_RADIUS_KM = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return EARTH_RADIUS_KM * c; 
}

// ==========================================
// 2. CORE GEOLOCATION LOGIC
// ==========================================
function checkUserLocation() {
    // If browser doesn't support GPS
    if (!navigator.geolocation) {
        userLocationState.isServiceable = false;
        userLocationState.errorMessage = "Geolocation is not supported by this browser.";
        applyLocationRestrictions("not-supported");
        return;
    }

    // Request high accuracy location from the device
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // Calculate how far away they are
            const distanceAway = calculateDistance(
                STORE_CONFIG.latitude, 
                STORE_CONFIG.longitude, 
                userLat, 
                userLng
            );

            userLocationState.hasChecked = true;

            // Check if they fall within the delivery circle
            if (distanceAway <= STORE_CONFIG.radiusKm) {
                userLocationState.isServiceable = true;
                liftLocationRestrictions();
            } else {
                userLocationState.isServiceable = false;
                userLocationState.errorMessage = `You are ${distanceAway.toFixed(1)}km away. We only deliver within ${STORE_CONFIG.radiusKm}km.`;
                applyLocationRestrictions("outside-zone");
            }
        },
        (error) => {
            userLocationState.hasChecked = true;
            userLocationState.isServiceable = false;
            
            // Handle specific GPS error states
            if (error.code === error.PERMISSION_DENIED) {
                userLocationState.errorMessage = "Location permission denied. Please allow location to place orders.";
                applyLocationRestrictions("denied");
            } else {
                userLocationState.errorMessage = "Unable to determine your location. Ordering disabled.";
                applyLocationRestrictions("error");
            }
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ==========================================
// 3. UI MANIPULATION (Locking / Unlocking)
// ==========================================

function applyLocationRestrictions(reason) {
    // Target all "Add to cart" buttons and "Checkout" triggers
    // IMPORTANT: Make sure your HTML buttons use these exact classes/IDs or adjust them below
    const dynamicButtons = document.querySelectorAll('.home-btn-cart, .product-btn-cart, #checkout-button');

    dynamicButtons.forEach(button => {
        button.disabled = true;
        // Save original text if we haven't already, so we can restore it later
        if (!button.getAttribute('data-original-text')) {
            button.setAttribute('data-original-text', button.innerText);
        }
        button.innerText = "Browsing Mode Only";
        button.classList.add('pwa-disabled-btn');
    });

    showTopBanner(reason);
}

function liftLocationRestrictions() {
    const dynamicButtons = document.querySelectorAll('.home-btn-cart, .product-btn-cart, #checkout-button');

    dynamicButtons.forEach(button => {
        button.disabled = false;
        // Restore original action text (e.g., "Add to Cart")
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerText = originalText;
        }
        button.classList.remove('pwa-disabled-btn');
    });

    hideTopBanner();
}

// ==========================================
// 4. NOTIFICATION BANNER GENERATION
// ==========================================
function showTopBanner(reason) {
    let banner = document.getElementById(STORE_CONFIG.bannerId);
    
    // If banner element doesn't exist in HTML, create it dynamically on the fly
    if (!banner) {
        banner = document.createElement('div');
        banner.id = STORE_CONFIG.bannerId;
        // Basic sleek styling via JS so you don't even have to open your CSS file
        banner.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; background: #fff3cd; color: #856404; text-align: center; padding: 12px 15px; font-weight: bold; font-size: 14px; z-index: 99999; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-bottom: 1px solid #ffeeba; box-sizing: border-box;";
        document.body.prepend(banner);
        
        // Push body content down slightly so the banner doesn't overlap header
        document.body.style.paddingTop = "45px"; 
    }

    let displayMessage = "📍 Window Shopping Mode: " + userLocationState.errorMessage;
    
    if (reason === "denied") {
        displayMessage = "📍 Location access blocked. You can browse, but enabling location is required to buy items.";
    }

    banner.innerText = displayMessage;
    banner.style.display = 'block';
}

function hideTopBanner() {
    const banner = document.getElementById(STORE_CONFIG.bannerId);
    if (banner) {
        banner.style.display = 'none';
        document.body.style.paddingTop = "0px";
    }
}

// ==========================================
// 5. INITIALIZATION RUN
// ==========================================
// Trigger the check as soon as the DOM page finishes rendering
document.addEventListener("DOMContentLoaded", () => {
    // Start with things blocked as a safe default while calculating
    applyLocationRestrictions("checking");
    checkUserLocation();
});
