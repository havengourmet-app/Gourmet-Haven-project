document.addEventListener("DOMContentLoaded", () => {
  // Use more specific IDs from signup.html
  const signupForm = document.getElementById("signup-form");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const errorMessage = document.getElementById("error-message");

  // Ensure all elements were found
  if (!signupForm || !emailInput || !usernameInput || !passwordInput || !confirmPasswordInput || !errorMessage) {
    console.error("Signup form elements not found. Check HTML IDs.");
    return;
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
    event.preventDefault();

    // Clear previous errors
    hideError();

    const role = roleInput ? roleInput.value : 'user';
    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
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

    const MAX_PASSWORD_LENGTH = 60;
    if (password.length > MAX_PASSWORD_LENGTH) {
      showError(`Password must be ${MAX_PASSWORD_LENGTH} characters or less.`);
      return;
    }

    // --- 2. Send Data to Backend ---
    try {
      const submitButton = signupForm.querySelector("button[type='submit']");
      if (submitButton) submitButton.disabled = true;

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: role,
          email: email,
          username: username,
          password: password,
        }),
      });

      // --- 3. Handle Backend Response ---
      if (response.ok) {
        const result = await response.json();
        console.log("Signup successful:", result);
        showError("Signup successful! Redirecting...", true);
        
        // Fade out effect
        document.body.style.transition = 'opacity 0.5s ease-out';
        document.body.style.opacity = '0';
        
        // Redirect based on role
        setTimeout(() => {
          if (role === 'owner') {
            window.location.href = 'owner-homepage.html';
          } else if (role === 'delivery_partner') {
            window.location.href = 'delivery-dashboard.html'; // You'll create this later
          } else {
            window.location.href = 'user-homepage.html';
          }
        }, 500);

      } else {
        let errorMsg = "An unknown error occurred during signup.";
        try {
          const errorData = await response.json();
          errorMsg = errorData?.detail || `Server error: ${response.status}`;
        } catch (jsonError) {
          errorMsg = `Server error: ${response.status} - ${response.statusText}`;
        }
        showError(errorMsg);
        if (submitButton) submitButton.disabled = false;
      }

    } catch (networkError) {
      console.error("Network error during signup:", networkError);
      showError("Could not connect to the server. Please check your network and try again.");
      const submitButton = signupForm.querySelector("button[type='submit']");
      if (submitButton) submitButton.disabled = false;
    }
  });

  function showError(message, isSuccess = false) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    errorMessage.style.color = isSuccess ? "#01de1a" : "#e57373";
  }

  function hideError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }
});