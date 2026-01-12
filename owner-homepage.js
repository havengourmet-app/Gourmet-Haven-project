// Sample data for menu items
let menuItems = [
    {
        id: 1,
        name: 'Chicken Biryani',
        description: 'Aromatic basmati rice with tender chicken pieces',
        price: 299,
        category: 'biryani',
        vegetarian: false,
        available: true
    },
    {
        id: 2,
        name: 'Paneer Tikka',
        description: 'Cottage cheese marinated in spices',
        price: 249,
        category: 'appetizers',
        vegetarian: true,
        available: true
    },
    {
        id: 3,
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce and cheese',
        price: 349,
        category: 'pizza',
        vegetarian: true,
        available: true
    }
];

// Sample data for orders
const sampleOrders = {
    today: [
        { id: 1, customer: 'Rahul Sharma', items: 'Chicken Biryani x2', amount: 598 },
        { id: 2, customer: 'Priya Patel', items: 'Paneer Tikka x1', amount: 249 },
        { id: 3, customer: 'Amit Kumar', items: 'Margherita Pizza x1', amount: 349 }
    ],
    yesterday: [
        { id: 4, customer: 'Sneha Reddy', items: 'Chicken Biryani x1', amount: 299 },
        { id: 5, customer: 'Vikram Singh', items: 'Paneer Tikka x2', amount: 498 }
    ],
    week: [
        { id: 6, customer: 'Multiple Orders', items: '45 orders', amount: 13450 }
    ],
    month: [
        { id: 7, customer: 'Multiple Orders', items: '180 orders', amount: 53700 }
    ]
};

const stats = {
    today: { orders: 3, revenue: 1196, rating: 4.5 },
    yesterday: { orders: 2, revenue: 797, rating: 4.3 },
    week: { orders: 45, revenue: 13450, rating: 4.4 },
    month: { orders: 180, revenue: 53700, rating: 4.5 }
};

let currentPeriod = 'today';
let editingItemId = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadUserInfo();
    initializeDropdown();
    initializeTimePeriodSelector();
    renderMenuItems();
    updateDashboard();
    initializeModal();
    initializeLogout();
});

// Check authentication
function checkAuthentication() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
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
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Initialize dropdown
function initializeDropdown() {
    const userProfile = document.getElementById('user-profile');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (!userProfile || !dropdownMenu) return;

    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}

// Initialize time period selector
function initializeTimePeriodSelector() {
    const periodButtons = document.querySelectorAll('.period-btn');
    
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            currentPeriod = button.getAttribute('data-period');
            updateDashboard();
        });
    });
}

// Update dashboard with current period data
function updateDashboard() {
    const currentStats = stats[currentPeriod];
    const currentOrders = sampleOrders[currentPeriod];
    
    document.getElementById('total-orders').textContent = currentStats.orders;
    document.getElementById('total-revenue').textContent = `₹${currentStats.revenue.toLocaleString()}`;
    document.getElementById('avg-rating').textContent = currentStats.rating.toFixed(1);
    document.getElementById('menu-items-count').textContent = menuItems.length;
    
    renderOrders(currentOrders);
}

// Render orders
function renderOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    
    if (!ordersList) return;
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                <p>No orders for this period</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>Order #${order.id}</h4>
                <div class="order-details">
                    <span>${order.customer}</span> • <span>${order.items}</span>
                </div>
            </div>
            <div class="order-amount">₹${order.amount}</div>
        </div>
    `).join('');
}

// Render menu items
function renderMenuItems() {
    const container = document.getElementById('menu-items');
    
    if (!container) return;
    
    if (menuItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                </svg>
                <p>No menu items yet. Add your first item!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = menuItems.map(item => `
        <div class="menu-item-card" data-id="${item.id}">
            <div class="menu-item-info">
                <div class="menu-item-header">
                    <div class="menu-item-name">${item.name}</div>
                    <div class="${item.vegetarian ? 'veg-badge' : 'non-veg-badge'}"></div>
                </div>
                ${item.description ? `<div class="menu-item-description">${item.description}</div>` : ''}
                <div class="menu-item-meta">
                    <span class="menu-item-price">₹${item.price}</span>
                    <span class="menu-item-category">${formatCategory(item.category)}</span>
                </div>
            </div>
            <div class="menu-item-actions">
                <button class="icon-btn toggle-btn ${item.available ? 'active' : ''}" onclick="toggleItemAvailability(${item.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
                <button class="icon-btn edit-btn" onclick="editMenuItem(${item.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="icon-btn delete-btn" onclick="deleteMenuItem(${item.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Format category name
function formatCategory(category) {
    return category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Toggle item availability
function toggleItemAvailability(id) {
    const item = menuItems.find(i => i.id === id);
    if (item) {
        item.available = !item.available;
        renderMenuItems();
        updateDashboard();
    }
}

// Edit menu item
function editMenuItem(id) {
    editingItemId = id;
    const item = menuItems.find(i => i.id === id);
    
    if (!item) return;
    
    document.getElementById('modal-title').textContent = 'Edit Menu Item';
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-description').value = item.description || '';
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-vegetarian').checked = item.vegetarian;
    document.getElementById('item-available').checked = item.available;
    
    document.getElementById('menu-modal').classList.add('show');
}

// Delete menu item
function deleteMenuItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    menuItems = menuItems.filter(item => item.id !== id);
    renderMenuItems();
    updateDashboard();
}

// Initialize modal
function initializeModal() {
    const modal = document.getElementById('menu-modal');
    const addBtn = document.getElementById('add-item-btn');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('menu-item-form');
    
    if (!modal || !addBtn || !closeBtn || !cancelBtn || !form) return;
    
    addBtn.addEventListener('click', () => {
        editingItemId = null;
        document.getElementById('modal-title').textContent = 'Add Menu Item';
        form.reset();
        document.getElementById('item-available').checked = true;
        modal.classList.add('show');
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    form.addEventListener('submit', handleFormSubmit);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('item-name').value,
        description: document.getElementById('item-description').value,
        price: parseFloat(document.getElementById('item-price').value),
        category: document.getElementById('item-category').value,
        vegetarian: document.getElementById('item-vegetarian').checked,
        available: document.getElementById('item-available').checked
    };
    
    if (editingItemId) {
        const item = menuItems.find(i => i.id === editingItemId);
        if (item) {
            Object.assign(item, formData);
        }
    } else {
        const newItem = {
            id: Math.max(...menuItems.map(i => i.id), 0) + 1,
            ...formData
        };
        menuItems.push(newItem);
    }
    
    renderMenuItems();
    updateDashboard();
    document.getElementById('menu-modal').classList.remove('show');
}

// Initialize logout
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