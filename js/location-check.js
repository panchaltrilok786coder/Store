/**
 * PWA Location-Based Ordering Guard
 * Works for Vanilla JS / HTML standard setups.
 */

// ==========================================
// CONFIGURATION: Set your shop's details here
// ==========================================
const STORE_CONFIG = {
    latitude: 40.7128,    // Replace with your business latitude
    longitude: -74.0060,  // Replace with your business longitude
    radiusKm: 15,         // Your maximum delivery radius in kilometers
    bannerId: 'pwa-location-banner' // The ID of the HTML element for notices
};

// Global state tracking
let userLocationState = {
    isServiceable: false,
    hasChecked: false,
    statusType: "checking", 
    errorMessage: "Checking delivery eligibility..."
};

// Global reference for our observer so we can control it
let pageObserver = null;

// ==========================================
// 1. DISTANCE MATHEMATICS (Haversine Formula)
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const EARTH_RADIUS_KM = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return EARTH_RADIUS_KM * c; 
}

// ==========================================
// 2. CORE GEOLOCATION LOGIC
// ==========================================
function checkUserLocation() {
    if (!navigator.geolocation) {
        userLocationState.isServiceable = false;
        userLocationState.hasChecked = true;
        userLocationState.statusType = "not-supported";
        userLocationState.errorMessage = "Geolocation is not supported by this browser.";
        executeUIUpdate();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            const distanceAway = calculateDistance(
                STORE_CONFIG.latitude, 
                STORE_CONFIG.longitude, 
                userLat, 
                userLng
            );

            userLocationState.hasChecked = true;

            if (distanceAway <= STORE_CONFIG.radiusKm) {
                userLocationState.isServiceable = true;
                userLocationState.statusType = "approved";
                executeUIUpdate();
            } else {
                userLocationState.isServiceable = false;
                userLocationState.statusType = "outside-zone";
                userLocationState.errorMessage = `You are ${distanceAway.toFixed(1)}km away. We only deliver within ${STORE_CONFIG.radiusKm}km.`;
                executeUIUpdate();
            }
        },
        (error) => {
            userLocationState.hasChecked = true;
            userLocationState.isServiceable = false;
            
            if (error.code === error.PERMISSION_DENIED) {
                userLocationState.statusType = "denied";
                userLocationState.errorMessage = "Location access blocked. Please enable location settings to purchase.";
            } else {
                userLocationState.statusType = "error";
                userLocationState.errorMessage = "Unable to determine your location. Ordering disabled.";
            }
            executeUIUpdate();
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ==========================================
// 3. UI MANAGEMENT ENGINE (Safe from Infinite Loops)
// ==========================================

function executeUIUpdate() {
    // 1. Temporarily pause the observer while we modify the DOM
    if (pageObserver) pageObserver.disconnect();

    // 2. Determine whether to lock or unlock elements
    if (userLocationState.hasChecked && userLocationState.isServiceable) {
        liftLocationRestrictions();
    } else {
        applyLocationRestrictions();
    }

    // 3. Safely resume observing the DOM changes
    if (pageObserver) {
        pageObserver.observe(document.body, { childList: true, subtree: true });
    }
}

function applyLocationRestrictions() {
    const dynamicButtons = document.querySelectorAll('.home-btn-cart, .product-btn-cart, #checkout-button');

    dynamicButtons.forEach(button => {
        button.disabled = true;
        if (!button.getAttribute('data-original-text')) {
            button.setAttribute('data-original-text', button.textContent.trim());
        }
        // Only update text if it isn't already changed (prevents unnecessary layout shifts)
        if (button.textContent !== "Browsing Mode Only") {
            button.textContent = "Browsing Mode Only";
        }
        button.classList.add('pwa-disabled-btn');
    });

    showTopBanner();
}

function liftLocationRestrictions() {
    const dynamicButtons = document.querySelectorAll('.home-btn-cart, .product-btn-cart, #checkout-button');

    dynamicButtons.forEach(button => {
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        if (originalText && button.textContent !== originalText) {
            button.textContent = originalText;
        }
        button.classList.remove('pwa-disabled-btn');
    });

    hideTopBanner();
}

// ==========================================
// 4. NOTIFICATION BANNER GENERATION
// ==========================================
function showTopBanner() {
    let banner = document.getElementById(STORE_CONFIG.bannerId);
    
    if (!banner) {
        banner = document.createElement('div');
        banner.id = STORE_CONFIG.bannerId;
        banner.style.cssText = "position: sticky; top: 0; left: 0; width: 100%; background: #fff3cd; color: #856404; text-align: center; padding: 12px 15px; font-weight: bold; font-size: 14px; z-index: 99999; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-bottom: 1px solid #ffeeba; box-sizing: border-box;";
        document.body.prepend(banner);
    }

    let displayMessage = "📍 " + userLocationState.errorMessage;
    
    if (userLocationState.statusType === "checking") {
        displayMessage = "📍 Checking delivery availability nearby...";
    } else if (userLocationState.statusType === "denied") {
        displayMessage = "📍 Location access blocked. Please enable location to buy items.";
    }

    if (banner.textContent !== displayMessage) {
        banner.textContent = displayMessage;
    }
    banner.style.display = 'block';
}

function hideTopBanner() {
    const banner = document.getElementById(STORE_CONFIG.bannerId);
    if (banner) {
        banner.style.display = 'none';
    }
}

// ==========================================
// 5. INITIALIZATION & DYNAMIC MUTATION ENGINE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Initialize UI adjustments straight away
    executeUIUpdate();
    checkUserLocation();

    // Set up the dynamic page-switch listener cleanly
    pageObserver = new MutationObserver(() => {
        executeUIUpdate();
    });

    // Fire up the observer
    pageObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
});
