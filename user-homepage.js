// Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    checkAuthentication();

    // Load user information
    loadUserInfo();

    // Initialize dropdown functionality
    initializeDropdown();

    // Initialize search functionality
    initializeSearch();

    // Initialize logout functionality
    initializeLogout();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
        // No token found, redirect to login
        window.location.href = 'login.html';
        return;
    }

    // Optional: Verify token with backend
    // You can add an API call here to validate the token
}

// Load user information
async function loadUserInfo() {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    try {
        // Call your backend API to get user info
        const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();

            // Update user name in the UI
            const userNameElement = document.getElementById('user-name');
            const userInitialElement = document.getElementById('user-initial');

            if (user.username) {
                userNameElement.textContent = user.username;
                userInitialElement.textContent = user.username.charAt(0).toUpperCase();
            }
        } else if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        // Continue without user info, but keep them on the page
    }
}

// Initialize dropdown menu
function initializeDropdown() {
    const userProfile = document.getElementById('user-profile');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (!userProfile || !dropdownMenu) return;

    // Toggle dropdown on click
    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Prevent dropdown from closing when clicking inside it
    dropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');

    if (!searchInput) return;

    // Add debounce to search
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);

        const query = e.target.value.trim();

        if (query.length === 0) {
            // Clear search results if input is empty
            return;
        }

        // Debounce search for 500ms
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500);
    });

    // Handle Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                performSearch(query);
            }
        }
    });
}

// Perform search
async function performSearch(query) {
    console.log('Searching for:', query);

    try {
        const token = localStorage.getItem('accessToken');

        // Call your search API endpoint
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const results = await response.json();
            displaySearchResults(results);
        } else {
            console.error('Search failed:', response.status);
        }
    } catch (error) {
        console.error('Error performing search:', error);
        // For now, just log the error
        // In production, you might want to show a user-friendly message
    }
}

// Display search results
function displaySearchResults(results) {
    console.log('Search results:', results);

    // TODO: Implement search results display
    // You can create a search results overlay or redirect to a search page
    // For now, this is a placeholder

    // Example: Redirect to search results page
    // window.location.href = `search.html?q=${encodeURIComponent(query)}`;
}

// Initialize logout functionality
function initializeLogout() {
    const logoutBtn = document.getElementById('logout-btn');

    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
}

// Handle logout
function handleLogout() {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to logout?');

    if (!confirmed) return;

    // Clear authentication token
    localStorage.removeItem('accessToken');

    // Optional: Call backend logout endpoint if you have one
    // This is useful for invalidating tokens on the server side

    // Add fade out effect
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0';

    // Redirect to login page after fade
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 300);
}

// Add click handlers to category cards
document.addEventListener('DOMContentLoaded', () => {
    const categoryCards = document.querySelectorAll('.category-card');

    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.querySelector('p').textContent;
            searchByCategory(category);
        });
    });
});

// Search by category
function searchByCategory(category) {
    console.log('Searching by category:', category);

    // Update search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = category;
    }

    // Perform search
    performSearch(category);

    // Or redirect to search/category page
    // window.location.href = `search.html?category=${encodeURIComponent(category)}`;
}

// Add click handlers to brand cards
document.addEventListener('DOMContentLoaded', () => {
    const brandCards = document.querySelectorAll('.brand-card');

    brandCards.forEach(card => {
        card.addEventListener('click', () => {
            const brandName = card.querySelector('h3').textContent;
            // Redirect to restaurant page or open restaurant details
            console.log('Opening brand:', brandName);
            // window.location.href = `restaurant.html?name=${encodeURIComponent(brandName)}`;
        });
    });
});

// Add click handlers to restaurant cards
document.addEventListener('DOMContentLoaded', () => {
    const restaurantCards = document.querySelectorAll('.restaurant-card');

    restaurantCards.forEach(card => {
        card.addEventListener('click', () => {
            const restaurantName = card.querySelector('h3').textContent;
            // Redirect to restaurant details page
            console.log('Opening restaurant:', restaurantName);
            // window.location.href = `restaurant.html?name=${encodeURIComponent(restaurantName)}`;
        });
    });
});

// Optional: Load more restaurants dynamically
async function loadRestaurants() {
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch('/api/restaurants', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const restaurants = await response.json();
            renderRestaurants(restaurants);
        }
    } catch (error) {
        console.error('Error loading restaurants:', error);
    }
}

// Render restaurants dynamically
function renderRestaurants(restaurants) {
    const restaurantList = document.getElementById('restaurant-list');

    if (!restaurantList || !restaurants || restaurants.length === 0) return;

    // Clear existing content (except the placeholder cards)
    // restaurantList.innerHTML = '';

    restaurants.forEach(restaurant => {
        const card = createRestaurantCard(restaurant);
        restaurantList.appendChild(card);
    });
}

// Create restaurant card element
function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';

    card.innerHTML = `
        <div class="restaurant-image">
            <img src="${restaurant.image || 'food.jpeg'}" 
                 alt="${restaurant.name}"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Restaurant'">
            ${restaurant.discount ? `<div class="discount-badge">${restaurant.discount}% OFF</div>` : ''}
        </div>
        <div class="restaurant-details">
            <h3>${restaurant.name}</h3>
            <p class="cuisine">${restaurant.cuisine || 'Various cuisines'}</p>
            <div class="restaurant-meta">
                <span class="rating">⭐ ${restaurant.rating || '4.0'}</span>
                <span class="dot">•</span>
                <span>${restaurant.deliveryTime || '30-35'} mins</span>
                <span class="dot">•</span>
                <span>₹${restaurant.priceForTwo || '300'} for two</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        console.log('Opening restaurant:', restaurant.name);
        // window.location.href = `restaurant.html?id=${restaurant.id}`;
    });

    return card;
}

// Optional: Call loadRestaurants if you want to load from API
// Uncomment when your backend API is ready
// loadRestaurants();