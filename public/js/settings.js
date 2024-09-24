// Toggle Side Menu
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const mainContent = document.getElementById('mainContent');

menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('hidden');
    mainContent.classList.toggle('expanded');
});

// Display Current Date and Time
function updateDateTime() {
    const dateTimeSpan = document.querySelector('.date-time-text');
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    dateTimeSpan.textContent = formattedDate;
}

setInterval(updateDateTime, 1000);




// Get modal elements
var modal = document.getElementById("reports-modal");
var icon = document.getElementById("reports-dropdown");
var closeBtn = document.querySelector(".reports-close");

// When the icon or text is clicked, open the modal
icon.onclick = function () {
    modal.style.display = "block";
}

// When the close button is clicked, close the modal
// closeBtn.onclick = function () {
//     modal.style.display = "none";
// }

// Close the modal if the user clicks outside of the modal content
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}


// Fetch session data and populate profile information
fetch('/session')
    .then(response => {
        if (!response.ok) {
            throw new Error('Not logged in');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('firstName').textContent = data.first_name;
        document.getElementById('lastName').textContent = data.last_name;
        document.getElementById('pfNumber').textContent = data.pf_number;
        document.getElementById('email').textContent = data.email;
        document.getElementById('phoneNumber').textContent = data.phone_number;
        document.getElementById('department').textContent = data.department;
        document.getElementById('role').textContent = data.role;
        document.getElementById('status').textContent = data.status;

        const adminNameElements = document.querySelectorAll('.adminName');
        adminNameElements.forEach(el => {
            el.textContent = data.last_name;
        });
    })
    
    .catch(error => {
        console.error('Error fetching session data:', error);
    });



// Modal logic for password change
const passwordModal = document.getElementById('changePasswordModal');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const closeModal = document.getElementById('closeModal');

// Open modal on button click
changePasswordBtn.addEventListener('click', () => {
    passwordModal.style.display = 'flex';
});

// Close modal on close button click
closeModal.addEventListener('click', () => {
    passwordModal.style.display = 'none';
});

// Close modal when clicking outside the modal content
window.addEventListener('click', (event) => {
    if (event.target === passwordModal) {
        passwordModal.style.display = 'none';
    }
});



document.getElementById('changePasswordForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    fetch('/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to change password');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        // Optionally close the modal
        document.getElementById('changePasswordModal').style.display = 'none';
    })
    .catch(error => {
        alert(error.message);
    });
});

// Optional: Close modal
document.getElementById('closeModal').onclick = function() {
    document.getElementById('changePasswordModal').style.display = 'none';
}


// Add event listener for the logout button
document.querySelector('.fa-sign-out-alt').parentElement.addEventListener('click', function () {
    // Show the confirmation dialog
    document.getElementById('logoutConfirmationDialog').style.display = 'flex';
});

// Handle "Yes" click in the confirmation dialog
document.getElementById('logoutConfirmYes').addEventListener('click', function () {
    // Send logout request to the server
    fetch('/logout')
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;  // Redirect to the login page
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
        });

    // Hide the confirmation dialog
    document.getElementById('logoutConfirmationDialog').style.display = 'none';
});

// Handle "No" click in the confirmation dialog
document.getElementById('logoutConfirmNo').addEventListener('click', function () {
    document.getElementById('logoutConfirmationDialog').style.display = 'none';
});



