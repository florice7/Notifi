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


// JavaScript to enlarge the search container on click and restore size on outside click
document.addEventListener('click', function (event) {
    const searchContainer = document.querySelector('.search-container');

    // Check if the click is inside the search-container
    if (searchContainer.contains(event.target)) {
        searchContainer.classList.add('enlarged');
    } else {
        searchContainer.classList.remove('enlarged');
    }
});




// Function to show the modal
function showModal(selectedCount) {
    const modal = document.getElementById('actionsModal');
    const selectedCountElement = document.getElementById('selectedCount');
    selectedCountElement.textContent = `${selectedCount} Employees selected`;
    modal.style.display = 'flex'; // Change display to flex to show the modal
}

// Function to hide the modal
function hideModal() {
    const modal = document.getElementById('actionsModal');
    modal.style.display = 'none';
}

// Fetch data and populate the table
fetch('/employees')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.querySelector('#employeeTable tbody');
        data.forEach(employee => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td><input type="radio" class="select-row"></td>  <!-- Radio Button instead of checkbox -->
                <td>${employee.pf_number}</td>
                <td>${employee.first_name}</td>
                <td>${employee.last_name}</td>
                <td>${employee.gender}</td>
                <td>${employee.date_of_birth}</td>
                <td>${employee.email}</td>
                <td>${employee.phone_number}</td>
                <td>${employee.department}</td>
            `;

            tableBody.appendChild(row);
        });

        // Select All functionality
        const selectAllRadio = document.getElementById('selectAll');
        const radios = document.querySelectorAll('.select-row');
        const selectedCountElement = document.getElementById('selectedCount');
        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');

        // Toggle selection for the Select All radio button
        selectAllRadio.addEventListener('click', () => {
            const isChecked = selectAllRadio.dataset.checked === 'true';
            selectAllRadio.dataset.checked = isChecked ? 'false' : 'true';
            radios.forEach(radio => {
                radio.checked = !isChecked;
                radio.dataset.checked = !isChecked ? 'true' : 'false';
            });
            updateSelectAllState();
            updateSelectedCount();
        });

        function updateSelectAllState() {
            const allChecked = Array.from(radios).every(radio => radio.checked);
            const anyChecked = Array.from(radios).some(radio => radio.checked);

            selectAllRadio.checked = allChecked;
            selectAllRadio.dataset.checked = allChecked ? 'true' : 'false';
        }



        // Toggle individual row selection
        radios.forEach(radio => {
            radio.dataset.checked = 'false'; // Initialize each radio button as unchecked

            radio.addEventListener('click', function () {
                const isChecked = this.dataset.checked === 'true';
                this.checked = !isChecked;
                this.dataset.checked = !isChecked ? 'true' : 'false';

                updateSelectAllState();
                updateSelectedCount();
            });
        });

        function updateSelectedCount() {
            const selectedRows = document.querySelectorAll('.select-row:checked');
            const selectedCount = selectedRows.length;
            selectedCountElement.textContent = `${selectedCount} Employee(s) selected`;

            // Enable delete button if one or more rows are selected
            deleteBtn.disabled = selectedCount === 0;

            // Enable edit button only if exactly one row is selected
            if (selectedCount === 1) {
                editBtn.classList.add('active'); // Add active class when one row is selected
            } else {
                editBtn.classList.remove('active'); // Remove active class otherwise
            }

            // Show or hide modal based on the selected count
            if (selectedCount > 0) {
                showModal(selectedCount);
            } else {
                hideModal();
            }
        }

        updateSelectAllState();

    });





let originalPfNumber; // To store the original PF number

const editModal = document.getElementById('editModal');
const closeModalButton = document.getElementById('close');
const editForm = document.getElementById('editForm');

// When Edit button is clicked, show the modal and populate the form with selected employee data
document.getElementById('editBtn').addEventListener('click', () => {
    const selectedRow = document.querySelector('.select-row:checked'); // Get the selected row
    if (selectedRow) {
        const row = selectedRow.closest('tr'); // Get the row element of the selected radio

        // Populate the form with the employee data
        originalPfNumber = row.cells[1].textContent; // Store the original PF number
        document.getElementById('edit-pf_number').value = originalPfNumber;
        document.getElementById('edit-first_name').value = row.cells[2].textContent;
        document.getElementById('edit-last_name').value = row.cells[3].textContent;

        // Set gender (male/female)
        const gender = row.cells[4].textContent.trim();
        if (gender === 'Male') {
            document.getElementById('edit-gender-male').checked = true;
        } else if (gender === 'Female') {
            document.getElementById('edit-gender-female').checked = true;
        }

        document.getElementById('edit-date_of_birth').value = row.cells[5].textContent;
        document.getElementById('edit-email').value = row.cells[6].textContent;
        document.getElementById('edit-phone_number').value = row.cells[7].textContent;
        document.getElementById('edit-department').value = row.cells[8].textContent;

        // Show the modal by changing its CSS
        hideModal();
        editModal.style.display = 'block';
    }
});

// Close the modal when the close button (x) is clicked
closeModalButton.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// Close the modal when clicking outside the modal content
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
});



document.getElementById('editButton').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent form submission

    // Get values from the form
    const pfNumber = document.getElementById('edit-pf_number').value.trim();
    const firstName = document.getElementById('edit-first_name').value.trim();
    const lastName = document.getElementById('edit-last_name').value.trim();
    const genderRadio = document.querySelector('input[name="edit-gender"]:checked');
    const gender = genderRadio ? genderRadio.value : null; // Handle case where no radio button is selected
    const dateOfBirth = document.getElementById('edit-date_of_birth').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phoneNumber = document.getElementById('edit-phone_number').value.trim();
    const department = document.getElementById('edit-department').value.trim();

    // Validate PF Number (exactly 5 digits)
    if (!/^\d{5}$/.test(pfNumber)) {
        alert('PF Number must be exactly 5 digits.');
        return;
    }

    // Validate Phone Number (exactly 10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
        alert('Phone Number must be exactly 10 digits.');
        return;
    }

    // Validate Email
    if (!/\S+@\S+\.\S+/.test(email)) {
        alert('Email is invalid.');
        return;
    }

    // Proceed with the PUT request using the original PF number in the URL
    fetch(`/employees/${originalPfNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pf_number: pfNumber, // New PF number to update
            first_name: firstName,
            last_name: lastName,
            gender: gender,
            date_of_birth: dateOfBirth,
            email: email,
            phone_number: phoneNumber,
            department: department
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Updated successfully') {
            alert(data.message);
            
            // Close the modal
            document.getElementById('editModal').style.display = 'none';
            
            // Update the UI - find the row in the table and update its content
            const selectedRow = document.querySelector('.select-row:checked').closest('tr');
            if (selectedRow) {
                selectedRow.cells[1].textContent = pfNumber;
                selectedRow.cells[2].textContent = firstName;
                selectedRow.cells[3].textContent = lastName;
                selectedRow.cells[4].textContent = gender;
                selectedRow.cells[5].textContent = dateOfBirth;
                selectedRow.cells[6].textContent = email;
                selectedRow.cells[7].textContent = phoneNumber;
                selectedRow.cells[8].textContent = department;
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error updating employee:', error);
        alert('Error updating employee');
    });
});



// Variables for modal and buttons
const addModal = document.getElementById('addModal');
const openAddModalButton = document.getElementById('openAddModal');
const closeAddModalButton = document.getElementById('closeAddModal');

// Function to open the modal
openAddModalButton.addEventListener('click', () => {
    addModal.style.display = 'block';  // Show the modal
});

// Function to close the modal when clicking the close button
closeAddModalButton.addEventListener('click', () => {
    addModal.style.display = 'none';  // Hide the modal
});

// Function to close the modal when clicking outside the modal content
window.addEventListener('click', (event) => {
    if (event.target === addModal) {
        addModal.style.display = 'none';  // Hide the modal
    }
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


document.getElementById('registerButton').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent form submission

    // Get values from the form
    const pfNumber = document.getElementById('add-pf_number').value.trim();
    const firstName = document.getElementById('add-first_name').value.trim();
    const lastName = document.getElementById('add-last_name').value.trim();
    
    const genderRadio = document.querySelector('input[name="add-gender"]:checked');
    const gender = genderRadio ? genderRadio.value : null; // Handle case where no radio button is selected

    const dateOfBirth = document.getElementById('add-date_of_birth').value.trim();
    const email = document.getElementById('add-email').value.trim();
    const phoneNumber = document.getElementById('add-phone_number').value.trim();
    const department = document.getElementById('add-department').value.trim();

    // Validate PF Number (exactly 5 digits)
    if (!/^\d{5}$/.test(pfNumber)) {
        alert('PF Number must be exactly 5 digits.');
        return;
    }

    // Validate Phone Number (exactly 10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
        alert('Phone Number must be exactly 10 digits.');
        return;
    }

    // Validate Email
    if (!/\S+@\S+\.\S+/.test(email)) {
        alert('Email is invalid.');
        return;
    }

    // Validate other fields
    if (!firstName || !lastName || !gender || !dateOfBirth || !department) {
        alert('Please fill out all fields.');
        return;
    }

    // If all validations pass, proceed with the POST request to add the employee
    fetch('/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pf_number: pfNumber,
            first_name: firstName,
            last_name: lastName,
            gender: gender,
            date_of_birth: dateOfBirth,
            email: email,
            phone_number: phoneNumber,
            department: department
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Employee added successfully') {
            alert(data.message);

            // Update the employee table
            updateEmployeeTable(pfNumber, firstName, lastName, gender, dateOfBirth, email, phoneNumber, department);

            // Hide the modal and reset the form
            document.getElementById('addModal').style.display = 'none';  // Hide the modal
            document.getElementById('addForm').reset();  // Clear the form
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error adding employee:', error);
        alert('Error adding employee');
    });
});


function updateEmployeeTable(pfNumber, firstName, lastName, gender, dateOfBirth, email, phoneNumber, department) {
    // Get the table body where the employees are listed
    const tableBody = document.querySelector('#employeeTable tbody');

    // Create a new row
    const newRow = document.createElement('tr');

    // Insert data into the new row
    newRow.innerHTML = `
        <td><input type="radio" class="select-row"></td>
        <td>${pfNumber}</td>
        <td>${firstName}</td>
        <td>${lastName}</td>
        <td>${gender}</td>
        <td>${dateOfBirth}</td>
        <td>${email}</td>
        <td>${phoneNumber}</td>
        <td>${department}</td>
    `;

    // Append the new row to the table
    tableBody.appendChild(newRow);
}


// Access the delete button, confirmation dialog, and confirmation message element
const deleteButton = document.getElementById('deleteBtn');
const confirmationDialog = document.getElementById('confirmationDialog');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
const confirmationMessage = document.getElementById('confirmationMessage');

// Function to show the confirmation dialog with a custom message
function showConfirmationDialog(selectedCount) {
    if (selectedCount === 1) {
        confirmationMessage.textContent = 'Are you sure you want to delete this record?';
    } else {
        confirmationMessage.textContent = `Are you sure you want to delete ${selectedCount} records?`;
    }
    confirmationDialog.style.display = 'flex'; 
}

// Function to hide the confirmation dialog
function hideConfirmationDialog() {
    confirmationDialog.style.display = 'none';
}

// Function to get selected PF Numbers
function getSelectedPfNumbers() {
    const selectedRows = document.querySelectorAll('.select-row:checked');
    const pfNumbers = [];

    selectedRows.forEach((row) => {
        const pfNumber = row.closest('tr').cells[1].textContent; // Assuming PF Number is in the second column
        pfNumbers.push(pfNumber);
    });

    return pfNumbers;
}

// Event listener for the delete button
deleteButton.addEventListener('click', () => {
    const selectedPfNumbers = getSelectedPfNumbers();
    const selectedCount = selectedPfNumbers.length;

    if (selectedCount > 0) {
        // Show the confirmation dialog with the appropriate message
        showConfirmationDialog(selectedCount);
    } else {
        alert("Please select at least one record to delete.");
    }
});

// Event listener for the "No" button (to close the dialog)
confirmNo.addEventListener('click', hideConfirmationDialog);

// Event listener for the "Yes" button (to confirm deletion)
// confirmYes.addEventListener('click', () => {
//     const selectedPfNumbers = getSelectedPfNumbers();
//     if (selectedPfNumbers.length > 0) {
//         console.log("Deleted PF Numbers:", selectedPfNumbers);        
//         hideConfirmationDialog(); 
//     }
// });

// Handle the Yes button click (confirm deletion)
confirmYes.addEventListener('click', () => {
    const selectedPfNumbers = getSelectedPfNumbers();

    if (selectedPfNumbers.length > 0) {
        // Send DELETE request for all selected PF numbers
        fetch('/employees', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pf_numbers: selectedPfNumbers }) // Send the array of PF numbers
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Employees deleted successfully') {
                alert(data.message);
                // Remove the selected rows from the UI
                document.querySelectorAll('.select-row:checked').forEach((checkbox) => {
                    checkbox.closest('tr').remove();
                });
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting employees:', error);
            alert('Error deleting employees');
        });

        // Hide the confirmation dialog after deletion
        hideConfirmationDialog();
    }
});

// Handle the No button click (cancel deletion)
confirmNo.addEventListener('click', () => {
    hideConfirmationDialog();
});

// Close the dialog when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === confirmationDialog) {
        hideConfirmationDialog();
    }
});


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

