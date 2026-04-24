// ================= IMPORTS =================
// Import firebase db and auth
// Import route protection
// Import firestore functions (collection, query, where, getDocs)
// Import authentication listener (onAuthStateChanged)


// ================= ROUTE PROTECTION =================
// Protect this page so only customers can access it


// ================= DOM ELEMENTS =================
// Get reference to:
// - orders container
// - navbar buttons (home, cart, logout)


// ================= GLOBAL STATE =================
// Create variable to store all orders


// ================= LOAD ORDERS FUNCTION =================
// Purpose: Fetch only logged-in user's orders
// Steps:
// 1. Get current user
// 2. If no user → redirect/login alert
// 3. Query "orders" collection where userId == currentUser.uid
// 4. Fetch documents
// 5. Store data in array
// 6. Call renderOrders()


// ================= RENDER ORDERS FUNCTION =================
// Purpose: Display orders in UI
// Steps:
// 1. Clear container
// 2. Loop through orders array
// 3. For each order:
//    - Create order card
//    - Show order ID
//    - Show items list
//    - Show total price
//    - Show status
// 4. Append to DOM


// ================= FORMAT ITEMS FUNCTION =================
// Purpose: Convert items array into readable HTML
// Steps:
// - Loop items
// - Return formatted string or DOM elements


// ================= STATUS DISPLAY FUNCTION =================
// Purpose: Handle order status UI
// Example:
// - Placed
// - Shipped
// - Delivered


// ================= NAVBAR BUTTONS =================
// Home button → redirect to home.html
// Cart button → redirect to cart.html
// Logout button → sign out user + redirect login.html


// ================= INIT FUNCTION =================
// Purpose:
// 1. Wait for auth state
// 2. Load orders
// 3. Render UI


// ================= ERROR HANDLING =================
// Show alerts for:
// - no user
// - fetch failure
// - empty orders