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



function getRoleName(role) {
    switch (role) {
        case 1:
            return 'First Level';
        case 2:
            return 'Second Level';
        case 3:
            return 'Third Level';
        default:
            return 'Unknown';
    }
}







// Global variable to store admin data
let adminData = {};

document.addEventListener('DOMContentLoaded', () => {
    // Fetch the logged-in admin's profile data from the /session route
    fetch('/session')
        .then(response => {
            if (!response.ok) {
                throw new Error('Not logged in');
            }
            return response.json();
        })
        .then(data => {
            // Store all necessary information in the global adminData object
            adminData = {
                first_name: data.first_name,
                last_name: data.last_name,
                pf_number: data.pf_number,
                email: data.email,
                phone_number: data.phone_number,
                department: data.department,
                role: data.role,
                status: data.status
            };
            document.getElementById('adminName').textContent = adminData.last_name;
        })
        .catch(error => {
            console.error('Error fetching session data:', error);
        });
});



let admins = [];
// Fetch admin data from the server and populate the table
function fetchAdmins() {
    fetch('/getAdmins')
        .then(response => response.json())
        .then(data => {
            admins = data; // Store admin data globally
            populateAdminTable(admins);
        })
        .catch(error => console.error('Error fetching admin data:', error));
}

function renderActions(status, pf_number, loggedInPFNumber, adminId, passwordResetRequested) {
    const firstLevelAdminPF = '43290'; 

    // Don't render action buttons if it's the first level admin or logged-in admin
    if (pf_number === firstLevelAdminPF || pf_number === loggedInPFNumber) {
        return ''; 
    }

    // Render action buttons based on the status
    if (status === 'active' && parseInt(passwordResetRequested) === 1) { 
        return `
            <button class="reset-password-btn" data-pf="${adminId}">Reset Password</button>
        `;
    } else if (status === 'pending') {
        return `
            <button class="approve-btn" data-id="${adminId}">Approve</button>
            <button class="reject-btn" data-id="${adminId}">Reject</button>
        `;
    }

    return ''; // Default case
}


function populateAdminTable(admins) {
    const tableBody = document.querySelector('#adminTable tbody');
    const loggedInPFNumber = adminData.pf_number;
    tableBody.innerHTML = '';  // Clear the table

    admins.forEach(admin => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><input type="checkbox" class="admin-checkbox" value="${admin.id}" data-pf-number="${admin.pf_number}"></td>
            <td>${admin.id}</td>
            <td>${admin.pf_number}</td>
            <td>${admin.first_name}</td>
            <td>${admin.last_name}</td>
            <td>${admin.email}</td>
            <td>${admin.phone_number}</td>
            <td>${getRoleName(admin.role)}</td>
            <td>${admin.status}</td>
             <td>${renderActions(admin.status, admin.pf_number, loggedInPFNumber, admin.id, admin.password_reset_requested)}</td>
        `;

        tableBody.appendChild(row);
    });

    const adminCheckboxes = document.querySelectorAll('.admin-checkbox');

    // Add event listener for each checkbox
    adminCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function () {
            adminCheckboxes.forEach(cb => {
                if (cb !== this) {
                    cb.checked = false; 
                }
            });

            const pfNumber = this.dataset.pfNumber;

            // Check if the logged-in admin's checkbox is checked
            if (pfNumber === loggedInPFNumber) {
                hideAdminActionsModal(); 
                return; 
            }

            const selectedCount = Array.from(adminCheckboxes).filter(cb => cb.checked).length;
            document.getElementById('adminSelectedCount').textContent = `${selectedCount} Admin selected`;
            if (selectedCount > 0) {
                showAdminActionsModal();
            } else {
                hideAdminActionsModal();
            }
        });
    });
}


// Function to show the actions modal
function showAdminActionsModal() {
    const modal = document.getElementById('adminActionsModal');
    modal.style.display = 'block'; // Show modal
}

// Function to hide the actions modal
function hideAdminActionsModal() {
    const modal = document.getElementById('adminActionsModal');
    modal.style.display = 'none'; // Hide modal
}

// Call the fetch function to load admins when the page loads
document.addEventListener('DOMContentLoaded', fetchAdmins);


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


 
// Add event listener for the logout button
document.querySelector('.fa-sign-out-alt').parentElement.addEventListener('click', function() {
    // Show the confirmation dialog
    document.getElementById('logoutConfirmationDialog').style.display = 'flex';
});

// Handle "Yes" click in the confirmation dialog
document.getElementById('logoutConfirmYes').addEventListener('click', function() {
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
document.getElementById('logoutConfirmNo').addEventListener('click', function() {
    document.getElementById('logoutConfirmationDialog').style.display = 'none';
});


document.getElementById('reports-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this);

    fetch('/extract-data', {
        method: 'POST',
        body: new URLSearchParams(formData), // Send form data
    })
    .then(response => {
        if (response.ok) {
            return response.blob(); // Expect a file in response
        }
        throw new Error('Failed to generate the report');
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Notifi Report.xlsx'; // Download file as 'report.xlsx'
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(error => {
        console.error(error);
        alert('Error generating report');
    });
});


document.addEventListener('click', (event) => {
    // Approve admin
    if (event.target.classList.contains('approve-btn')) {
        const adminId = event.target.dataset.id;

        fetch('/approveAdmin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error approving admin');
            }
            return response.text();
        })
        .then(message => {
            console.log(message);
            // Refresh the admin table
            fetchAdmins();
        })
        .catch(error => console.error('Error:', error));
    }

    // Reject admin
    if (event.target.classList.contains('reject-btn')) {
        const adminId = event.target.dataset.id;

        fetch('/rejectAdmin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error rejecting admin');
            }
            return response.text();
        })
        .then(message => {
            console.log(message);
            // Refresh the admin table
            fetchAdmins();
        })
        .catch(error => console.error('Error:', error));
    }
   
});


// Show the edit modal when the edit button is clicked
document.getElementById('adminEditBtn').addEventListener('click', function () {
    const selectedCheckbox = document.querySelector('.admin-checkbox:checked');
    if (selectedCheckbox) {
        const selectedId = selectedCheckbox.value;
        const selectedRole = getRoleById(selectedId); // Fetch the role

        // Populate the edit modal with the current role
        const adminRoleSelect = document.getElementById('adminRole');
        adminRoleSelect.value = selectedRole; // Set the current role

        // Show the edit modal
        const editModal = document.getElementById('editAdminModal');
        editModal.style.display = 'flex';
        hideAdminActionsModal();
    }
});

// Fetch admin role by ID
function getRoleById(adminId) {
    const admin = admins.find(admin => admin.id == adminId);
    return admin ? admin.role : null;
}

// Handle form submission
document.getElementById('editAdminForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    const selectedCheckbox = document.querySelector('.admin-checkbox:checked');
    const selectedId = selectedCheckbox.value;
    const newRole = document.getElementById('adminRole').value;

    // Update the database (ensure this is implemented in your backend)
    updateAdminRole(selectedId, newRole)
        .then(() => {
            // Update the UI
            selectedCheckbox.closest('tr').cells[7].textContent = getRoleName(newRole);

            // Hide the edit modal after a successful update
            const editModal = document.getElementById('editAdminModal');
            editModal.style.display = 'none';
        })
        .catch(err => {
            console.error('Error updating role:', err);
        });
});

// Function to update the admin role on the backend
function updateAdminRole(adminId, newRole) {
    return fetch(`/updateAdminRole/${adminId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }), // Send the new role
    }).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
    });
}

// Close modal when clicking the close button (x)
document.querySelector('.editModalclose').addEventListener('click', function () {
    const editModal = document.getElementById('editAdminModal');
    editModal.style.display = 'none';
});

// Close modal when clicking outside the modal content
window.addEventListener('click', function (event) {
    const editModal = document.getElementById('editAdminModal');
    if (event.target == editModal) {
        editModal.style.display = 'none';
    }
});
