// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageElement = document.getElementById('error-message');

    // Add submit event listener to the form
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Hide previous error messages
        errorMessageElement.textContent = '';
        errorMessageElement.style.display = 'none';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Basic validation (optional, can add more)
        if (!email || !password) {
            showError("Please enter both email and password.");
            return;
        }

        // --- Call the backend API ---
        try {
            // FastAPI's OAuth2PasswordRequestForm expects form data, not JSON
            const formData = new URLSearchParams();
            formData.append('username', email); // IMPORTANT: FastAPI uses 'username' field for email here
            formData.append('password', password);

            const response = await fetch('/api/login/token', {
                method: 'POST',
                headers: {
                    // Send as form data
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData // Send form data
            });

            if (!response.ok) {
                let errorDetail = "Login failed. Please check your credentials.";
                // Try to parse error message from backend if available
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorDetail = errorData.detail;
                    }
                } catch (parseError) {
                    // Backend might not have sent JSON, use default message
                    console.warn("Could not parse error response from backend.");
                }
                throw new Error(errorDetail); // Throw error with message
            }

            // --- Login Successful ---
            const data = await response.json(); // Should contain { access_token: "...", token_type: "bearer" }

            if (data.access_token) {
                // Save the token in Local Storage
                localStorage.setItem('accessToken', data.access_token);
                console.log("Login successful, token saved:", data.access_token);

                // Show success feedback (optional)
                errorMessageElement.textContent = 'Login successful! Redirecting...';
                errorMessageElement.style.color = 'green';
                errorMessageElement.style.display = 'block';

                // Add fade out effect and redirect
                document.body.style.transition = 'opacity 0.3s ease';
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = 'dashboard.html'; // Redirect to dashboard
                }, 500); // Wait a bit longer after showing success message
            } else {
                throw new Error("Login successful, but no token received.");
            }

        } catch (error) {
            console.error('Login Error:', error);
            showError(error.message || "An error occurred during login."); // Show specific or generic error
        }
    });

    // Helper function to display errors
    function showError(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.color = 'red'; // Ensure error color
        errorMessageElement.style.display = 'block';
    }
});

