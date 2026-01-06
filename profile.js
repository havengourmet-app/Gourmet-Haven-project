document.addEventListener('DOMContentLoaded', () => {
    // --- Tab Switching Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');

            // Hide all tab contents
            tabContents.forEach(tab => tab.classList.remove('active'));
            // Show corresponding tab content
            const targetId = item.getAttribute('data-tab');
            const targetTab = document.getElementById(targetId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

    // --- Edit Profile Logic ---
    const toggleEditBtn = document.getElementById('toggle-edit-btn');
    const profileForm = document.getElementById('profile-form');
    const inputs = profileForm.querySelectorAll('input');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');

    let isEditMode = false;

    toggleEditBtn.addEventListener('click', (e) => {
        e.preventDefault();

        if (!isEditMode) {
            // Switch to Edit Mode
            enableEditMode();
        } else {
            // Attempt to Save
            if (validateForm()) {
                saveChanges();
                disableEditMode();
                showToast("Profile Updated Successfully!");
            }
        }
    });

    function enableEditMode() {
        isEditMode = true;
        inputs.forEach(input => input.removeAttribute('readonly'));
        toggleEditBtn.textContent = "Save Changes";
        toggleEditBtn.classList.add('save-mode');
        inputs[0].focus(); // Focus on first input
    }

    function disableEditMode() {
        isEditMode = false;
        inputs.forEach(input => input.setAttribute('readonly', true));
        toggleEditBtn.textContent = "Edit Profile";
        toggleEditBtn.classList.remove('save-mode');
        phoneError.style.display = 'none'; // Hide error if present
    }

    function validateForm() {
        // Phone Number Regex Validation (Exactly 10 digits)
        const phoneRegex = /^\d{10}$/;
        const phoneValue = phoneInput.value.trim();

        if (!phoneRegex.test(phoneValue)) {
            phoneError.style.display = 'block';
            phoneInput.focus();
            return false;
        }

        phoneError.style.display = 'none';
        return true;
    }

    function saveChanges() {
        // Here you would typically send an API request to update the user data
        console.log("Saving changes...", {
            name: document.getElementById('full-name').value,
            phone: document.getElementById('phone').value
        });
        // For now, we simulate a successful save locally
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Logout Button Placeholder
    document.getElementById('logout-btn').addEventListener('click', () => {
        // Redirect to login or handle logout
        window.location.href = 'login.html';
    });
});
