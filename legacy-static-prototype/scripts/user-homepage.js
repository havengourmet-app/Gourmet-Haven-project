// Sample data for search functionality
const dishes = [
    { name: 'Chicken Biryani', restaurant: 'Paradise Biryani', icon: '🍛' },
    { name: 'Hyderabadi Biryani', restaurant: 'Paradise Biryani', icon: '🍛' },
    { name: 'Margherita Pizza', restaurant: 'Pizza Hut', icon: '🍕' },
    { name: 'Pepperoni Pizza', restaurant: 'Dominos', icon: '🍕' },
    { name: 'Zinger Burger', restaurant: 'KFC', icon: '🍔' },
    { name: 'Whopper', restaurant: 'Burger King', icon: '🍔' },
    { name: 'Chicken Tikka', restaurant: 'Mehfil Restaurant', icon: '🍗' },
    { name: 'Butter Chicken', restaurant: 'Mehfil Restaurant', icon: '🍗' },
    { name: 'Fried Rice', restaurant: 'Paradise Biryani', icon: '🍚' },
    { name: 'Paneer Tikka', restaurant: 'Mehfil Restaurant', icon: '🧀' },
    { name: 'Shawarma Roll', restaurant: 'Absolute Barbecues', icon: '🌯' },
    { name: 'Grilled Chicken', restaurant: 'Absolute Barbecues', icon: '🍗' }
];

const restaurants = [
    { name: 'Paradise Biryani', cuisine: 'Biryani, Mughlai', rating: '4.5', icon: '🏪' },
    { name: 'Pizza Hut', cuisine: 'Pizza, Italian', rating: '4.2', icon: '🏪' },
    { name: 'KFC', cuisine: 'Chicken, Fast Food', rating: '4.3', icon: '🏪' },
    { name: 'Dominos Pizza', cuisine: 'Pizza, Italian', rating: '4.1', icon: '🏪' },
    { name: 'Burger King', cuisine: 'Burgers, Fast Food', rating: '4.0', icon: '🏪' },
    { name: 'Mehfil Restaurant', cuisine: 'North Indian, Chinese', rating: '4.4', icon: '🏪' },
    { name: 'Absolute Barbecues', cuisine: 'BBQ, Grills', rating: '4.3', icon: '🏪' }
];

// Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    checkAuthentication();

    // Load user information
    loadUserInfo();

    // Initialize location dropdown
    initializeLocationDropdown();

    // Initialize dropdown functionality
    initializeDropdown();

    // Initialize search functionality
    initializeSearch();

    // Initialize logout functionality
    initializeLogout();

    // Initialize view menu buttons
    initializeMenuButtons();

    // Initialize brand cards
    initializeBrandCards();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        // No token found, redirect to login
        // Commented out for demo purposes
        // window.location.href = 'login.html';
        console.log('No token found - would redirect to login');
        return;
    }
}

// Load user information
async function loadUserInfo() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return;

    try {
        const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            
            const userNameElement = document.getElementById('user-name');
            const userInitialElement = document.getElementById('user-initial');
            
            if (user.username) {
                userNameElement.textContent = user.username;
                userInitialElement.textContent = user.username.charAt(0).toUpperCase();
            }
        } else if (response.status === 401) {
            localStorage.removeItem('accessToken');
            // window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Initialize location dropdown
function initializeLocationDropdown() {
    const locationSelector = document.getElementById('location-selector');
    const locationDropdown = document.getElementById('location-dropdown');
    const userLocation = document.getElementById('user-location');
    const locationItems = document.querySelectorAll('.location-item');

    if (!locationSelector || !locationDropdown) return;

    // Toggle dropdown on click
    locationSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        locationDropdown.classList.toggle('show');
        locationSelector.classList.toggle('active');
        
        // Close user dropdown if open
        const userDropdown = document.getElementById('dropdown-menu');
        if (userDropdown) userDropdown.classList.remove('show');
        
        // Close search results if open
        const searchResults = document.getElementById('search-results');
        if (searchResults) searchResults.classList.remove('show');
    });

    // Handle location selection
    locationItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedCity = item.getAttribute('data-city');
            
            // Update displayed location
            userLocation.textContent = selectedCity;
            
            // Update active state
            locationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Close dropdown
            locationDropdown.classList.remove('show');
            locationSelector.classList.remove('active');
            
            console.log('Location changed to:', selectedCity);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!locationSelector.contains(e.target)) {
            locationDropdown.classList.remove('show');
            locationSelector.classList.remove('active');
        }
    });
}

// Initialize user dropdown menu
function initializeDropdown() {
    const userProfile = document.getElementById('user-profile');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (!userProfile || !dropdownMenu) return;

    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
        
        // Close location dropdown if open
        const locationDropdown = document.getElementById('location-dropdown');
        const locationSelector = document.getElementById('location-selector');
        if (locationDropdown) locationDropdown.classList.remove('show');
        if (locationSelector) locationSelector.classList.remove('active');
        
        // Close search results if open
        const searchResults = document.getElementById('search-results');
        if (searchResults) searchResults.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    dropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;

    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length === 0) {
            searchResults.classList.remove('show');
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    searchInput.addEventListener('focus', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length > 0) {
            searchResults.classList.add('show');
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                console.log('Search submitted:', query);
                searchResults.classList.remove('show');
            }
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });
}

// Perform search and display results
function performSearch(query) {
    const searchResults = document.getElementById('search-results');
    const dishesResults = document.getElementById('dishes-results');
    const restaurantsResults = document.getElementById('restaurants-results');
    
    if (!searchResults || !dishesResults || !restaurantsResults) return;

    // Filter dishes
    const filteredDishes = dishes.filter(dish => 
        dish.name.toLowerCase().includes(query)
    ).slice(0, 5);

    // Filter restaurants
    const filteredRestaurants = restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(query) || 
        restaurant.cuisine.toLowerCase().includes(query)
    ).slice(0, 5);

    // Clear previous results
    dishesResults.innerHTML = '';
    restaurantsResults.innerHTML = '';

    // Display dish results
    if (filteredDishes.length > 0) {
        filteredDishes.forEach(dish => {
            const item = createSearchResultItem(dish.name, dish.restaurant, 'dish');
            dishesResults.appendChild(item);
        });
    } else {
        dishesResults.innerHTML = '<div style="padding: 10px 20px; color: #999; font-size: 0.9rem;">No dishes found</div>';
    }

    // Display restaurant results
    if (filteredRestaurants.length > 0) {
        filteredRestaurants.forEach(restaurant => {
            const item = createSearchResultItem(restaurant.name, restaurant.cuisine, 'restaurant');
            restaurantsResults.appendChild(item);
        });
    } else {
        restaurantsResults.innerHTML = '<div style="padding: 10px 20px; color: #999; font-size: 0.9rem;">No restaurants found</div>';
    }

    // Show results
    searchResults.classList.add('show');
}

// Create search result item
function createSearchResultItem(name, meta, type) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    
    const icon = type === 'dish' ? 
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>' :
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';
    
    item.innerHTML = `
        <span class="search-result-icon">${icon}</span>
        <div class="search-result-text">${name}</div>
        <div class="search-result-meta">${meta}</div>
    `;
    
    item.addEventListener('click', () => {
        console.log(`Selected ${type}:`, name);
        document.getElementById('search-input').value = name;
        document.getElementById('search-results').classList.remove('show');
    });
    
    return item;
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
    const confirmed = confirm('Are you sure you want to logout?');
    
    if (!confirmed) return;

    localStorage.removeItem('accessToken');
    
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 300);
}

// Initialize view menu buttons
function initializeMenuButtons() {
    const menuButtons = document.querySelectorAll('.view-menu-btn');
    
    menuButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const restaurantCard = button.closest('.restaurant-card');
            const restaurantId = restaurantCard.getAttribute('data-restaurant');
            const restaurantName = restaurantCard.querySelector('h3').textContent;
            
            console.log('Opening menu for:', restaurantName);
            // Redirect to menu page
            // window.location.href = `menu.html?restaurant=${restaurantId}`;
            alert(`Opening menu for ${restaurantName}`);
        });
    });
}

// Initialize brand cards
function initializeBrandCards() {
    const brandCards = document.querySelectorAll('.brand-card');
    
    brandCards.forEach(card => {
        card.addEventListener('click', () => {
            const brandName = card.querySelector('h3').textContent;
            const brandId = card.getAttribute('data-brand');
            
            console.log('Opening brand:', brandName);
            // window.location.href = `restaurant.html?brand=${brandId}`;
            alert(`Opening ${brandName} menu`);
        });
    });
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
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = category;
        searchInput.focus();
        performSearch(category.toLowerCase());
    }
}

// Add click handlers to restaurant cards (outside menu button)
document.addEventListener('DOMContentLoaded', () => {
    const restaurantCards = document.querySelectorAll('.restaurant-card');
    
    restaurantCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking the menu button
            if (e.target.classList.contains('view-menu-btn')) {
                return;
            }
            
            const restaurantName = card.querySelector('h3').textContent;
            const restaurantId = card.getAttribute('data-restaurant');
            
            console.log('Opening restaurant details:', restaurantName);
            // window.location.href = `restaurant.html?id=${restaurantId}`;
        });
    });
});