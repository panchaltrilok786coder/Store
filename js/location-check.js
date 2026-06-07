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
    statusType: "checking", // Tracks 'checking', 'approved', 'denied', 'outside-zone', or 'error'
    errorMessage: "Checking delivery eligibility..."
};

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
        applyLocationRestrictions();
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
                liftLocationRestrictions();
            } else {
                userLocationState.isServiceable = false;
                userLocationState.statusType = "outside-zone";
                userLocationState.errorMessage = `You are ${distanceAway.toFixed(1)}km away. We only deliver within ${STORE_CONFIG.radiusKm}km.`;
                applyLocationRestrictions();
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
            applyLocationRestrictions();
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ==========================================
// 3. UI MANIPULATION (Locking / Unlocking)
// ==========================================

function applyLocationRestrictions() {
    // Find all target buttons currently rendered on the screen
    const dynamicButtons = document.querySelectorAll('.home-btn-cart, .product-btn-cart, #checkout-button');

    dynamicButtons.forEach(button => {
        button.disabled = true;
        // Save original text securely if not already done
        if (!button.getAttribute('data-original-text')) {
            button.setAttribute('data-original-text', button.textContent.trim());
        }
        button.textContent = "Browsing Mode Only";
        button.classList.add('pwa-disabled-btn');
    });

    showTopBanner();
}

function liftLocationRestrictions() {
    const dynamicButtons = document.querySelectorAll('.home-btn-cart, .product-btn-cart, #checkout-button');

    dynamicButtons.forEach(button => {
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
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
        // position: sticky ensures it plays nice with dynamic layout updates
        banner.style.cssText = "position: sticky; top: 0; left: 0; width: 100%; background: #fff3cd; color: #856404; text-align: center; padding: 12px 15px; font-weight: bold; font-size: 14px; z-index: 99999; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-bottom: 1px solid #ffeeba; box-sizing: border-box;";
        document.body.prepend(banner);
    }

    let displayMessage = "📍 " + userLocationState.errorMessage;
    
    if (userLocationState.statusType === "checking") {
        displayMessage = "📍 Checking delivery availability nearby...";
    } else if (userLocationState.statusType === "denied") {
        displayMessage = "📍 Location access blocked. Please enable location to buy items.";
    }

    banner.textContent = displayMessage;
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

// Step A: Kick off the primary load rules when document loads
document.addEventListener("DOMContentLoaded", () => {
    applyLocationRestrictions();
    checkUserLocation();
});

// Step B: Pure Vanilla dynamic listener. 
// Whenever product.js injects new HTML, this instantly intercepts it.
const pageObserver = new MutationObserver(() => {
    if (userLocationState.hasChecked) {
        if (userLocationState.isServiceable) {
            liftLocationRestrictions();
        } else {
            applyLocationRestrictions();
        }
    } else {
        // If the geolocation check hasn't finished responding yet, keep incoming buttons locked
        applyLocationRestrictions();
    }
});

// Start watching the body for dynamic switches
pageObserver.observe(document.body, {
    childList: true,
    subtree: true
});
