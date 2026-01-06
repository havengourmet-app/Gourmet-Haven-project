// Cart state - Initialize with pre-existing items
let cart = {
    'spicy-peas-pizza': {
        id: 'spicy-peas-pizza',
        name: 'Spicy Peas Pizza',
        price: 7.00,
        quantity: 1,
        image: 'food.jpeg',
        variant: 'Full'
    },
    'butter-corn-cone': {
        id: 'butter-corn-cone',
        name: 'Butter Corn Cone',
        price: 12.00,
        quantity: 1,
        image: 'food_item1.jpeg',
        variant: 'Full'
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeLocationDropdown();
    initializeDropdown();
    initializeLogout();
    updateCart();
});

// Initialize location dropdown
function initializeLocationDropdown() {
    const locationSelector = document.getElementById('location-selector');
    const locationDropdown = document.getElementById('location-dropdown');
    const userLocation = document.getElementById('user-location');
    const locationItems = document.querySelectorAll('.location-item');

    if (!locationSelector || !locationDropdown) return;

    locationSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        locationDropdown.classList.toggle('show');
        locationSelector.classList.toggle('active');

        const userDropdown = document.getElementById('dropdown-menu');
        if (userDropdown) userDropdown.classList.remove('show');
    });

    locationItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedCity = item.getAttribute('data-city');

            userLocation.textContent = selectedCity;

            locationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            locationDropdown.classList.remove('show');
            locationSelector.classList.remove('active');

            console.log('Location changed to:', selectedCity);
        });
    });

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

        const locationDropdown = document.getElementById('location-dropdown');
        const locationSelector = document.getElementById('location-selector');
        if (locationDropdown) locationDropdown.classList.remove('show');
        if (locationSelector) locationSelector.classList.remove('active');
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

    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0';

    setTimeout(() => {
        window.location.href = 'login.html';
    }, 300);
}

// Add item to cart
function addToCart(itemId, itemName, price, image) {
    if (cart[itemId]) {
        cart[itemId].quantity++;
    } else {
        cart[itemId] = {
            id: itemId,
            name: itemName,
            price: price,
            quantity: 1,
            image: image,
            variant: 'Full'
        };
    }

    updateCart();
    showNotification(`${itemName} added to cart!`);
}

// Remove item from cart
function removeFromCart(itemId) {
    if (cart[itemId]) {
        const itemName = cart[itemId].name;
        delete cart[itemId];
        updateCart();
        showNotification(`${itemName} removed from cart`);
    }
}

// Increment quantity
function incrementQty(itemId) {
    if (cart[itemId]) {
        cart[itemId].quantity++;
        updateCart();
    }
}

// Decrement quantity
function decrementQty(itemId) {
    if (cart[itemId]) {
        if (cart[itemId].quantity > 1) {
            cart[itemId].quantity--;
            updateCart();
        } else {
            removeFromCart(itemId);
        }
    }
}

// Update cart display
function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const subtotal = document.getElementById('subtotal');
    const total = document.getElementById('total');
    const placeOrderBtn = document.querySelector('.place-order-btn');

    if (!cartItemsContainer) return;

    const cartItems = Object.values(cart);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Update cart count
    if (cartCount) {
        cartCount.textContent = `${itemCount} ITEM${itemCount !== 1 ? 'S' : ''}`;
    }

    // Clear cart items
    cartItemsContainer.innerHTML = '';

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Your cart is empty</p>
            </div>
        `;

        if (subtotal) subtotal.textContent = '₹0.00';
        if (total) total.textContent = '₹0.00';
        if (placeOrderBtn) placeOrderBtn.disabled = true;
        return;
    }

    // Calculate totals
    let subtotalAmount = 0;

    // Add cart items
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotalAmount += itemTotal;

        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.setAttribute('data-cart-id', item.id);

        cartItemEl.innerHTML = `
            <div class="cart-item-header">
                <h4 class="cart-item-name">${item.name} - ${item.variant}</h4>
                <span class="cart-item-price">$${itemTotal.toFixed(2)}</span>
                <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </button>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="decrementQty('${item.id}')">-</button>
                <span class="qty-display" id="qty-${item.id}">${item.quantity}</span>
                <button class="qty-btn" onclick="incrementQty('${item.id}')">+</button>
            </div>
        `;

        cartItemsContainer.appendChild(cartItemEl);
    });

    // Update totals
    if (subtotal) subtotal.textContent = `₹${subtotalAmount.toFixed(2)}`;
    if (total) total.textContent = `₹${subtotalAmount.toFixed(2)}`;

    // Enable/disable order button based on minimum order
    const minOrder = 20.00;
    if (placeOrderBtn) {
        if (subtotalAmount >= minOrder) {
            placeOrderBtn.disabled = false;
        } else {
            placeOrderBtn.disabled = true;
        }
    }
}

// Place order
function placeOrder() {
    const cartItems = Object.values(cart);

    if (cartItems.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    const subtotalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const minOrder = 20.00;

    if (subtotalAmount < minOrder) {
        showNotification(`Minimum order amount is ₹${minOrder.toFixed(2)}`, 'error');
        return;
    }

    // Create order summary
    const orderSummary = {
        items: cartItems,
        subtotal: subtotalAmount,
        total: subtotalAmount,
        orderDate: new Date().toISOString(),
        location: document.getElementById('user-location').textContent
    };

    console.log('Order placed:', orderSummary);

    // Show confirmation
    const confirmed = confirm(`Place order for ₹${subtotalAmount.toFixed(2)}?`);

    if (confirmed) {
        // --- Order Sync Logic ---
        const newOrder = {
            id: 'ORD-' + Date.now(),
            restaurant: 'Gourmet Haven', // Defaulting to platform name for now, or could use first item's category
            items: orderSummary.items,
            total: orderSummary.total,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
            status: 'Order Placed',
            statusClass: 'status-inprogress' // css class for badge
        };

        const existingOrders = JSON.parse(localStorage.getItem('gourmet_orders') || '[]');
        existingOrders.push(newOrder); // Add to end, will reverse on display
        localStorage.setItem('gourmet_orders', JSON.stringify(existingOrders));
        // ------------------------

        showNotification('Order placed successfully!', 'success');

        // Clear cart after 2 seconds
        setTimeout(() => {
            cart = {};
            updateCart();
        }, 2000);

        // In a real app, you would send this to the server
        // fetch('/api/orders', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(orderSummary)
        // });
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${type === 'success' ? '#01de1a' : '#e74c3c'};
        color: ${type === 'success' ? '#000' : '#fff'};
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Search functionality
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            const itemName = item.querySelector('.item-name').textContent.toLowerCase();
            const itemDesc = item.querySelector('.item-description').textContent.toLowerCase();

            if (itemName.includes(query) || itemDesc.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });

        // Show/hide category sections if all items are hidden
        const categorySections = document.querySelectorAll('.category-section');
        categorySections.forEach(section => {
            const visibleItems = section.querySelectorAll('.menu-item[style="display: flex;"]');
            if (visibleItems.length === 0 && query !== '') {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        });
    });
}