 const scriptURL = 'https://script.google.com/macros/s/AKfycbzB-933ZJWT5AStO7BdhxZCCyvZeRHgNEja_pqXNZXmGl8rmcdzcSJ6dilOTAbwrdXf/exec';

 document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const loginTimestamp = parseInt(localStorage.getItem("loginTimestamp"), 10);
  const storedUsername = localStorage.getItem("username");
  const storedPassword = localStorage.getItem("password");

  const now = Date.now();
  const maxPersistenceDuration = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const sessionTimeoutDuration = 30 * 1000; // 30 seconds in milliseconds

  // Check if credentials are stored
  if (isLoggedIn && storedUsername && storedPassword) {
    // Check if 48 hours have passed
    if (now - loginTimestamp > maxPersistenceDuration) {
      // Clear credentials and show login form
      clearCredentials();
      showMessage("Your session has expired. Please log in again.", false);
      toggleForms("login-form");
    } else {
      // Check if the session has timed out (30 seconds)
      const sessionStart = parseInt(sessionStorage.getItem("sessionStart"), 10);
      if (!sessionStart || now - sessionStart > sessionTimeoutDuration) {
        // Clear session data and redirect to login
        clearSession();
        showMessage("Session timed out. Please log in again.", false);
        toggleForms("login-form");
      } else {
        // Refresh session timestamp and show dashboard
        sessionStorage.setItem("sessionStart", now.toString());
        autoLogin(storedUsername, storedPassword);
      }
    }
  } else {
    // No valid credentials; show login form
    clearCredentials();
    showMessage("Please log in to continue.", false);
    toggleForms("login-form");
  }

  // Handle URL parameters for password reset
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");
  const token = urlParams.get("token");

  if (email && token) {
    toggleForms("new-password-form");
    document.querySelector('#new-password-form input[name="email"]').value = email;
    document.querySelector('#new-password-form input[name="token"]').value = token;
  }
});

function autoLogin(username, password) {
  const formData = new FormData();
  formData.append("action", "login");
  formData.append("username", username);
  formData.append("password", password);

  fetch(scriptURL, { method: "POST", body: formData })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      if (data.result === "success") {
        // Store credentials and timestamps
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loginTimestamp", Date.now().toString());
        localStorage.setItem("dashboardData", JSON.stringify(data.dashboardData));
        sessionStorage.setItem("sessionStart", Date.now().toString());

        displayDashboard(data.dashboardData);
      } else {
        // Clear invalid credentials and show the login form
        clearCredentials();
        showMessage(data.message, false);
        toggleForms("login-form");
      }
    })
    .catch((error) => {
      console.error("Error during login:", error);
      showMessage("Error connecting to the server. Please try again later.", false);
      toggleForms("login-form");
    });
}

function clearCredentials() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("password");
  localStorage.removeItem("loginTimestamp");
  localStorage.removeItem("dashboardData");
}

function clearSession() {
  sessionStorage.removeItem("sessionStart");
}
  function toggleForms(formId) {
    document.querySelectorAll('form').forEach(form => {
      form.classList.remove('active');
      form.style.display = 'none';
    });

    // Adjust home button display based on form
    document.getElementById("login-form").style.display = (formId === 'signup-form'  || formId === 'reset-form') ? "none" : "block";

    const formToShow = document.getElementById(formId);
    formToShow.classList.add('active');
    formToShow.style.display = 'block';
  }
  
  function togglePasswordVisibility(inputName) {
  const passwordField = document.querySelector(`input[name="${inputName}"]`);
  if (passwordField) {
    const eyeIcon = passwordField.nextElementSibling;
    if (passwordField.type === "password") {
      passwordField.type = "text";
      eyeIcon.classList.remove("fa-eye-slash");
      eyeIcon.classList.add("fa-eye");
    } else {
      passwordField.type = "password";
      eyeIcon.classList.remove("fa-eye");
      eyeIcon.classList.add("fa-eye-slash");
    }
  }
}


 function submitForm(action) {
  const formId = (action === 'signup') ? 'signup-form' :
                 (action === 'login') ? 'login-form' :
                 (action === 'generateToken') ? 'reset-form' :
                 (action === 'resetPassword') ? 'new-password-form' : null;

  if (!formId) {
    showMessage("Invalid action specified", false);
    return;
  }

  const form = document.getElementById(formId);

  if (validateForm(form, action)) {
    const formData = new FormData(form);
    formData.append("action", action);

    fetch(scriptURL, { method: 'POST', body: formData })
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(data => {
        showMessage(data.message, data.result === "success");

        if (data.result === "success") {
          if (action === 'login') {
          localStorage.setItem("isLoggedIn", "true");  // Mark as logged in
          localStorage.setItem("dashboardData", JSON.stringify(data.dashboardData));  // Store dashboard data
            isLoggedIn = true; // Update login state
            displayDashboard(data.dashboardData); // Pass dashboard data on successful login
          } else if (['signup', 'resetPassword', 'generateToken'].includes(action)) {
            toggleForms('login-form');  
          }
        }
      })
      .catch(error => showMessage('Error connecting to server', false));
  }
}
  
 const scriptCashout = 'https://script.google.com/macros/s/AKfycbwSXcvIVljkQKrExqIRPTz813YNDlq1rHK10DNJk4RctQ1PqPGUe9kfYv8FE3H3Cspb/exec';

function submitCashOut() {
  if (!isLoggedIn) {
    showMessage("You need to log in to perform this action.", false);
    return;
  }

  const formId = 'cashout-form1';
  const form = document.getElementById(formId);

  if (validateForm(form, 'cashOut')) {
    const formData = new FormData(form);

    // Include the username and validated amount
    formData.append("action", "cashOut");
    formData.append("username", currentUsername); // Use globally stored username

    const amount = parseFloat(form.querySelector("input[name='amount']").value.trim());
    if (isNaN(amount) || amount <= 0) {
      showMessage("Please enter a valid amount greater than zero.", false);
      return;
    }
    formData.append("requestedAmount", amount); // Match with backend expectation

    // Show a loading message while waiting for the response
    showMessage("Submitting your cashout request...", true);

    fetch(scriptCashout, { method: 'POST', body: formData })
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(data => {
        // Show the backend response message
        showMessage(data.message, data.result === "success");

        if (data.result === "success") {
          // Hide the form on success
          hideForm(formId);
        }
      })
      .catch(error => {
        console.error("Error during submission:", error);
        showMessage("Error connecting to the server. Please try again later.", false);
      });
  }
}

// Function to hide the form
function hideForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.style.display = 'none';
    showMessage("Your cashout request has been submitted successfully!", true); // Confirmation message
  }
}


// Global variable for the logged-in user's username
let currentUsername = "";

// Existing function to display the dashboard and set currentUsername
function displayDashboard(dashboardData = {}) {
  currentUsername = dashboardData.username || ""; // Store username globally
  //document.getElementById("today-views").textContent = dashboardData.todayViews || 0;
  //document.getElementById("yesterday-views").textContent = dashboardData.yesterdayViews || 0;
  document.getElementById("total-views").textContent = dashboardData.totalViews || 0;
 // document.getElementById("today-income").textContent = "TSHS " + (dashboardData.todayIncome || 0);
 // document.getElementById("yesterday-income").textContent = "TSHS " + (dashboardData.yesterdayIncome || 0);
  document.getElementById("total-income").textContent = "TSHS " + (dashboardData.totalIncome || 0);

  document.getElementById("login-form").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("home-buttons").style.display = "none";
  document.getElementById("dashboard").querySelector("h2").textContent = `Welcome, ${currentUsername || "User"}!`;

  if (parseInt(dashboardData.totalIncome) >= 5000) {
    const alertElement = document.getElementById("alert1");
    alertElement.innerHTML = `You can Cash out .Transaction Fee will be Inclusive. Click the button: <button id="cashout-button">Cashout Now</button>`;

    // Add event listener to the cashout button
    document.getElementById("cashout-button").addEventListener("click", function () {
      cashOut();
    });
  }
}


function cashOut() {
   const alertElement = document.getElementById("alert1");
  // Show the cashout form when the cashout button is clicked
  document.getElementById("cashout-form1").style.display = "block";
  alertElement.style.display = "none";
}

  function logout() {
    localStorage.removeItem("isLoggedIn");
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("home-buttons").style.display = "flex";
    toggleForms('login-form');
  }

  function validateForm(form, action) {
    let isValid = true;
    form.querySelectorAll('input[required], select[required]').forEach(input => {
      if (!input.value.trim()) {
        showMessage(`${input.previousElementSibling.textContent} is required.`, false);
        isValid = false;
        return;
      }
    });

    if (isValid) {
      const email = form.querySelector('input[type="email"]');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showMessage("Please enter a valid email address.", false);
        isValid = false;
      }

      const phone = form.querySelector('input[name="phone"]');
if (phone) {
  const phoneValue = phone.value.trim();

  // Regular expression to validate Tanzanian phone numbers
  const phoneRegex = /^(065|061|062|067|068|069|071|074|075|076|077|078)[0-9]{7}$/;

  // Check if the phone number matches the regular expression
  if (!phoneRegex.test(phoneValue)) {
    showMessage("Please enter a valid 10-digit  phone number.", false);
    isValid = false;
  }
}

      
      const dob = form.querySelector('input[name="dob"]');  // Assuming there's an input field with name="dob"
if (phone && !/^[0-9]{10}$/.test(phone.value.trim())) {
  showMessage("Please enter a valid 10-digit phone number.", false);
  isValid = false;
}

if (dob) {
  // Get the value from the date of birth field
  const dobValue = dob.value.trim();

  // Check if the DOB value is empty
  if (!dobValue) {
    showMessage("Please enter your date of birth.", false);
    isValid = false;
  } else {
    // Parse the date of birth and calculate the user's age
    const dobDate = new Date(dobValue);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const monthDifference = today.getMonth() - dobDate.getMonth();

    // Check if the user is 18 years or older
    if (age < 18 || (age === 18 && monthDifference < 0)) {
      showMessage("It seems your age is below 18,You must be at least 18 years old to register.", false);
      isValid = false;
    }
  }
}

      const fullname = form.querySelector('input[name="fullname"]');
if (fullname) {
  const fullnameValue = fullname.value.trim();

  // Check if the full name contains at least two words
  const nameParts = fullnameValue.split(/\s+/); // Split by spaces
  if (nameParts.length < 2) {
    showMessage("Please enter at least your first and last name.", false);
    isValid = false;
  }
}
      const username = form.querySelector('input[name="username"]');

if (username) {
  const usernameValue = username.value.trim();

  // Regular expression to allow letters, numbers, and specific symbols, but no spaces
  const usernameRegex = /^[A-Za-z0-9@_.~#]+$/;

  // Check if the username matches the updated regex
  if (!usernameRegex.test(usernameValue)) {
    showMessage("Username can only contain letters, numbers, and symbols like @, _, ., ~, or #, with no spaces.", false);
    isValid = false;
  }

  // Check if the username contains at least one letter and is not only numbers
  if (/^\d+$/.test(usernameValue)) {
    showMessage("Username cannot be only numbers.", false);
    isValid = false;
  }
}
      // Validate region
  const region = form.querySelector('select[name="region"]');
  if (region && !region.value) {
    showMessage("Please select a region of residence.", false);
    isValid = false;
  }


      if ((action === 'signup' || action === 'resetPassword') && isValid) {
    const password = form.querySelector('input[name="password"]');
    const confirmPassword = form.querySelector('input[name="confirmPassword"]');
    
    // Regular expression to check for at least one letter, one number, or one special character, but not only special characters
    if (password && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+={}\[\]:;"'<>,.?/-]{8,}$/.test(password.value.trim())) {
        showMessage("Password must be at least 8 characters long and contain both letters and numbers. Special characters are optional, but not allowed alone.", false);
        isValid = false;
    }

    // Check if the passwords match
    if (password && confirmPassword && password.value.trim() !== confirmPassword.value.trim()) {
        showMessage("Passwords do not match.", false);
        isValid = false;
    }
}

    }
    return isValid;
  }
  
  
  
  function showMessage(message, success = true) {
    const messageBox = document.getElementById("message-box");
    messageBox.style.display = "block";
    messageBox.className = `message ${success ? "success" : "error"}`;
    messageBox.textContent = message;

    setTimeout(() => {
      messageBox.style.display = "none";
    }, 5000);
  }
  
const scriptURL1 = 'https://script.google.com/macros/s/AKfycbxjCyPTAlEo5bnkr-0XUh9nEFPV-3f7yiDvvUCzhG_evvh3Kc4IZnDzmR7DVSfo_O_p/exec';

document.addEventListener("DOMContentLoaded", () => {
 // Select all links with the class 'view-post-link'
const links = document.querySelectorAll('.view-post-link');

// Loop through each link and add an event listener
links.forEach(link => {
  link.addEventListener("click", (event) => {
    
    // Ensure the user is logged in and has a valid username
    if (!currentUsername) {
      alert("Please log in to register a view.");
      return;
    }

    // Call the incrementView function with the global username
    incrementView(currentUsername);
  });
  });
});

function incrementView(username) {
  const formData = new FormData();
  formData.append("action", "updateViews");
  formData.append("username", username);
  formData.append("increment", 1);

  fetch(scriptURL1, {
    method: "POST",
    body: formData, // Use FormData for compatibility
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Expecting JSON response from the server
    })
    .then((data) => {
      // Check if the response indicates success
      if (data.success) {
        console.log("View count updated successfully:", data);
        alert("Your view has been registered!");
      } else {
        // Handle the case where server returned an error
        console.error("Failed to update view count:", data.message);
        alert(`Error: ${data.message || "Unknown error occurred."}`);
      }
    });
    //.catch((error) => {
      // Log error in case of failure
      //console.error("Error occurred during view increment:", error);
      //alert("An error occurred while updating the view count. Please try again later.");
// });
}
