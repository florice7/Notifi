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


function fetchAdminData() {
    fetch('/getAdmins')
        .then(response => response.json())
        .then(data => populateAdminTable(data))
        .catch(error => console.error('Error fetching admin data:', error));
}

// function populateAdminTable(admins) {
//     const tableBody = document.querySelector('#adminTable tbody');
//     tableBody.innerHTML = '';  // Clear previous rows

//     admins.forEach(admin => {
//         const row = document.createElement('tr');

//         row.innerHTML = `
//             <td><input type="radio" class="admin-checkbox" value="${admin.id}"></td>
//             <td>${admin.id}</td>
//             <td>${admin.pf_number}</td>
//             <td>${admin.first_name}</td>
//             <td>${admin.last_name}</td>
//             <td>${admin.email}</td>
//             <td>${admin.phone_number}</td>
//             <td>${getRoleName(admin.role)}</td>
//             <td>${admin.status}</td>
//             <td>
//                 ${renderActions(admin.status)}  <!-- Actions will depend on status -->
//             </td>
//         `;

//         tableBody.appendChild(row);
//     });
// }


function renderActions(status, pf_number) {
    const firstLevelAdminPF = '43290'; 
    if (pf_number === firstLevelAdminPF) {
        return ''; // No buttons are rendered
    }

    // Render action buttons based on the status
    if (status === 'active') {
        return `
            <button class="deactivate-btn">Deactivate</button>
            <button class="reset-password-btn">Reset Password</button>
        `;
    } else if (status === 'inactive') {
        return `<button class="activate-btn">Activate</button>`;
    } else if (status === 'pending') {
        return `
            <button class="approve-btn">Approve</button>
            <button class="reject-btn">Reject</button>
        `;
    }
}


document.addEventListener('DOMContentLoaded', function () {
    fetchAdminData();
});



// Select All functionality for Admins
const selectAllAdmins = document.getElementById('selectAllAdmins'); 
const adminSelectedCountElement = document.getElementById('adminSelectedCount');  
const adminEditBtn = document.getElementById('adminEditBtn');  
const adminDeleteBtn = document.getElementById('adminDeleteBtn');  

function populateAdminTable(admins) {
    const tableBody = document.querySelector('#adminTable tbody');
    tableBody.innerHTML = '';  

    admins.forEach(admin => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><input type="radio" class="admin-checkbox" value="${admin.id}"></td>
            <td>${admin.id}</td>
            <td>${admin.pf_number}</td>
            <td>${admin.first_name}</td>
            <td>${admin.last_name}</td>
            <td>${admin.email}</td>
            <td>${admin.phone_number}</td>
            <td>${getRoleName(admin.role)}</td>
            <td>${admin.status}</td>
            <td>
            ${renderActions(admin.status, admin.pf_number)}
            </td>
        `;

        tableBody.appendChild(row);
    });

    const adminRadios = document.querySelectorAll('.admin-checkbox');

    adminRadios.forEach(radio => {
        radio.dataset.checked = 'false';  // Initialize each radio button as unchecked

        radio.addEventListener('click', function () {
            const isChecked = this.dataset.checked === 'true';
            this.checked = !isChecked;
            this.dataset.checked = !isChecked ? 'true' : 'false';

            updateSelectAllAdminState();
            updateAdminSelectedCount();
        });
    });

    updateSelectAllAdminState();  // Initialize the Select All state
}

// Toggle selection for the Select All radio button
selectAllAdmins.addEventListener('click', () => {
    const adminRadios = document.querySelectorAll('.admin-checkbox'); 
    const isChecked = selectAllAdmins.dataset.checked === 'true';
    selectAllAdmins.dataset.checked = isChecked ? 'false' : 'true';

    adminRadios.forEach(radio => {
        radio.checked = !isChecked;
        radio.dataset.checked = !isChecked ? 'true' : 'false';
    });

    updateAdminSelectedCount();
    updateSelectAllAdminState();
});

function updateSelectAllAdminState() {
    const adminRadios = document.querySelectorAll('.admin-checkbox');
    const allChecked = Array.from(adminRadios).every(radio => radio.checked);
    const anyChecked = Array.from(adminRadios).some(radio => radio.checked);

    selectAllAdmins.checked = allChecked;
    selectAllAdmins.dataset.checked = allChecked ? 'true' : 'false';
}

// Update selected count and handle enabling/disabling buttons
function updateAdminSelectedCount() {
    const selectedAdmins = document.querySelectorAll('.admin-checkbox:checked');
    const selectedCount = selectedAdmins.length;
    adminSelectedCountElement.textContent = `${selectedCount} Admin(s) selected`;

    // Enable edit button only if exactly one row is selected
    if (selectedCount === 1) {
        adminEditBtn.classList.add('active');  
    } else {
        adminEditBtn.classList.remove('active');  
    }

    // Show or hide the modal based on the selected count
    if (selectedCount > 0) {
        showAdminActionsModal();
    } else {
        hideAdminActionsModal();
    }
}

// Functions to show and hide the modal
function showAdminActionsModal() {
    document.getElementById('adminActionsModal').style.display = 'block';
}

function hideAdminActionsModal() {
    document.getElementById('adminActionsModal').style.display = 'none';
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