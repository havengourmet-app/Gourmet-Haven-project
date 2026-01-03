document.addEventListener("DOMContentLoaded", () => {
  // Use more specific IDs from signup.html
  const signupForm = document.getElementById("signup-form"); // Use form ID
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const errorMessage = document.getElementById("error-message");

  // Ensure all elements were found
  if (!signupForm || !emailInput || !usernameInput || !passwordInput || !confirmPasswordInput || !errorMessage) {
    console.error("Signup form elements not found. Check HTML IDs.");
    // Optionally display a user-facing error here
    return; // Stop execution if elements are missing
  }


  // Role Selection Logic
  const roleItems = document.querySelectorAll('.role-item');
  const roleInput = document.getElementById('role');

  if (roleItems.length > 0 && roleInput) {
    roleItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove active class from all
        roleItems.forEach(i => i.classList.remove('active'));
        // Add active class to clicked
        item.classList.add('active');
        // Update hidden input
        roleInput.value = item.dataset.value;
      });
    });
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Clear previous errors
    hideError();

    const role = roleInput ? roleInput.value : 'user'; // Default to user if not found
    const email = emailInput.value.trim(); // Trim whitespace
    const username = usernameInput.value.trim();
    const password = passwordInput.value; // No trim for password
    const confirmPassword = confirmPasswordInput.value;

    // --- 1. Frontend Validation ---
    if (!email || !username || !password || !confirmPassword) {
      showError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    // --- Check password length (Bcrypt limit is 72 bytes) ---
    // Frontend check (e.g., 60 characters) for better UX
    const MAX_PASSWORD_LENGTH = 60;
    if (password.length > MAX_PASSWORD_LENGTH) {
      showError(`Password must be ${MAX_PASSWORD_LENGTH} characters or less.`);
      return;
    }
    // --- End of password length check ---

    // Optional: Add more checks like email format, username format/length

    // --- 2. Send Data to Backend ---
    try {
      // Add loading indicator? (e.g., disable button)
      const submitButton = signupForm.querySelector("button[type='submit']");
      if (submitButton) submitButton.disabled = true;

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add other headers if needed (e.g., CSRF token later)
        },
        body: JSON.stringify({
          role: role,
          email: email,
          username: username,
          password: password, // Send the original password to backend
        }),
      });

      // --- 3. Handle Backend Response ---
      if (response.ok) {
        // Success
        const result = await response.json(); // Get the created user data (UserOut)
        console.log("Signup successful:", result);
        showError("Signup successful! Redirecting to login...", true); // Show success message
        // Fade out effect
        document.body.style.transition = 'opacity 0.5s ease-out';
        document.body.style.opacity = '0';
        // Redirect after fade
        setTimeout(() => {
          window.location.href = 'login.html'; // Redirect to login page
        }, 500); // Match fade duration

      } else {
        // Handle specific errors (like 400 Bad Request)
        let errorMsg = "An unknown error occurred during signup."; // Default
        try {
          const errorData = await response.json();
          // Use optional chaining (?.) in case detail is missing
          errorMsg = errorData?.detail || `Server error: ${response.status}`;
        } catch (jsonError) {
          // If response is not JSON
          errorMsg = `Server error: ${response.status} - ${response.statusText}`;
        }
        showError(errorMsg);
        if (submitButton) submitButton.disabled = false; // Re-enable button on error
      }

    } catch (networkError) {
      // Handle network errors (e.g., server down)
      console.error("Network error during signup:", networkError);
      showError("Could not connect to the server. Please check your network and try again.");
      const submitButton = signupForm.querySelector("button[type='submit']");
      if (submitButton) submitButton.disabled = false; // Re-enable button on error
    }
  });

  function showError(message, isSuccess = false) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block"; // Make it visible
    errorMessage.style.color = isSuccess ? "green" : "red"; // Use CSS classes ideally
    // Consider adding ARIA attributes for accessibility
  }

  function hideError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none'; // Hide it
  }
});

