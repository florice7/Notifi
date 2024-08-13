document.addEventListener('DOMContentLoaded', () => {
    fetch('/employees')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched employee data:", data); // Log the fetched data

            const tableBody = document.querySelector('#employeeTable tbody');

            tableBody.innerHTML = data.map(employee => {
                // Manually format the date of birth to avoid timezone issues
                const formattedDate = employee.date_of_birth;

                console.log(`Employee PF: ${employee.pf_number}, DOB: ${formattedDate}`); // Log the PF number and DOB
                return `
                    <tr>
                        <td>${employee.pf_number}</td>
                        <td>${employee.first_name}</td>
                        <td>${employee.last_name}</td>
                        <td>${employee.gender}</td>
                        <td>${formattedDate}</td>
                        <td>${employee.email}</td>
                        <td>${employee.phone_number}</td>
                        <td>${employee.preferred_notification_method}</td>
                        <td>${employee.department}</td>
                        <td>
                        <div class="table-buttons">
                            <button class="edit-btn" data-id="${employee.pf_number}">Edit</button>
                            <button class="delete-btn" data-id="${employee.pf_number}">Delete</button>
                        </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Add event listeners for the edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', handleEdit);
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', handleDelete);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});


// Function to format the date manually
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns the date part in YYYY-MM-DD format
}


function filterTable(filter) {
    const today = new Date();
    const tomorrow = new Date(today);
    const nextWeek = new Date(today);
    const nextMonth = new Date(today);

    tomorrow.setDate(today.getDate() + 1);
    nextWeek.setDate(today.getDate() + 7);
    nextMonth.setDate(today.getDate() + 30);

    const tableBody = document.querySelector('#employeeTable tbody');
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(row => {
        const dobCell = row.querySelector('td:nth-child(5)'); // Assuming DOB is the 5th column
        const dob = new Date(dobCell.textContent.trim());

        const isToday = dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
        const isTomorrow = dob.getDate() === tomorrow.getDate() && dob.getMonth() === tomorrow.getMonth();
        const isNextWeek = dob.getDate() === nextWeek.getDate() && dob.getMonth() === nextWeek.getMonth();
        const isNext30Days = dob >= today && dob <= nextMonth;

        let showRow = false;

        switch (filter) {
            case 'all':
                showRow = true;
                break;
            case 'current':
                showRow = isToday;
                break;
            case 'nextDay':
                showRow = isTomorrow;
                break;
            case 'oneWeek':
                showRow = isNextWeek;
                break;
            case 'next30Days':
                showRow = isNext30Days;
                break;
        }

        row.style.display = showRow ? '' : 'none';
    });
}



// // Validation function for PF number
// function validatePFNumber(pfNumber) {
//     const pattern = /^\d{5}$/;
//     return pattern.test(pfNumber);
// }

// // Check PF number uniqueness
// async function isPFNumberUnique(pfNumber) {
//     const response = await fetch(`/employees/pf_number/${pfNumber}`);
//     return response.ok;
// }

// Validation function for PF number

// Function to handle the edit button click
function handleEdit(event) {
    const pfNumber = event.target.dataset.id;
    fetch(`/employees/${pfNumber}`)
        .then(response => response.json())
        .then(employee => {
            document.querySelector('#edit-pf_number').value = employee.pf_number;
            document.querySelector('#edit-pf_number').dataset.originalPfNumber = employee.pf_number; // Store the original PF number
            document.querySelector('#edit-first_name').value = employee.first_name;
            document.querySelector('#edit-last_name').value = employee.last_name;
            document.querySelector(`input[name="edit-gender"][value="${employee.gender}"]`).checked = true;

            
            document.querySelector('#edit-date_of_birth').value = employee.date_of_birth;

            document.querySelector('#edit-email').value = employee.email;
            document.querySelector('#edit-phone_number').value = employee.phone_number;
            document.querySelector('#edit-preferred_notification_method').value = employee.preferred_notification_method;
            document.querySelector('#edit-department').value = employee.department;

            const editModal = document.querySelector('#editModal');
            editModal.style.display = 'block';

            const closeEditModal = document.querySelector('#editModal #close');
            closeEditModal.onclick = function () {
                editModal.style.display = 'none';
            };

            window.onclick = function (event) {
                if (event.target == editModal) {
                    editModal.style.display = 'none';
                }
            };
        })
        .catch(error => console.error('Error fetching employee data:', error));
}

// Function to format the date manually (same as before)
// function formatDate(dateString) {
//     const date = new Date(dateString);
//     const year = date.getUTCFullYear();
//     const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
//     const day = String(date.getUTCDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// }


// Function to validate the PF number
function validatePFNumber(pfNumber) {
    const pattern = /^\d{5}$/;
    return pattern.test(pfNumber);
}

// Function to check PF number uniqueness
async function isPFNumberUnique(pfNumber) {
    const response = await fetch(`/employees/pf_number/${pfNumber}`);
    return response.status === 404; // Return true if PF number does not exist
}

// Add submit event listener to the edit form
document.querySelector('#editForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    console.log("Form submission triggered");

    const pfNumber = document.querySelector('#edit-pf_number').value;
    const originalPFNumber = document.querySelector('#edit-pf_number').dataset.originalPfNumber;
    
    console.log("PF Number:", pfNumber);
    console.log("Original PF Number:", originalPFNumber);

    if (!validatePFNumber(pfNumber)) {
        alert('PF Number must be exactly five digits.');
        return;
    }

    // Check if PF number is unique only if it has been changed
    if (pfNumber !== originalPFNumber) {
        const isUnique = await isPFNumberUnique(pfNumber);
        if (!isUnique) {
            alert('The PF number must be unique.');
            return;
        }
    }

    const genderRadio = document.querySelector('input[name="edit-gender"]:checked');
    if (!genderRadio) {
        alert('Please select a gender.');
        return;
    }
    const gender = genderRadio.value;

    const updatedEmployee = {
        pf_number: pfNumber,
        first_name: document.querySelector('#edit-first_name').value,
        last_name: document.querySelector('#edit-last_name').value,
        gender: gender,
        date_of_birth: document.querySelector('#edit-date_of_birth').value,
        email: document.querySelector('#edit-email').value,
        phone_number: document.querySelector('#edit-phone_number').value,
        preferred_notification_method: document.querySelector('#edit-preferred_notification_method').value,
        department: document.querySelector('#edit-department').value
    };

    fetch(`/employees/${originalPFNumber}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEmployee)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Employee updated successfully') {
            const editModal = document.querySelector('#editModal');
            editModal.style.display = 'none';
            location.reload(); // Reload the page to see the updated data
        } else {
            console.error('Failed to update employee');
        }
    })
    .catch(error => console.error('Error updating employee:', error));
});



function handleDelete(event) {
    const pfNumber = event.target.dataset.id;

    fetch(`/employees/${pfNumber}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            event.target.closest('tr').remove();
        } else {
            console.error('Failed to delete employee');
        }
    })
    .catch(error => console.error('Error deleting employee:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    const addModal = document.getElementById('addModal');
    const closeAddModal = document.querySelector('#addModal #close');
    const addForm = document.getElementById('addForm');

    // Open add modal
    window.openAddModal = function() {
        addModal.style.display = 'block';
    };

    // Close add modal
    closeAddModal.onclick = function () {
        addModal.style.display = 'none';
    };

    // Close add modal when clicking outside of it
    window.onclick = function (event) {
        if (event.target == addModal) {
            addModal.style.display = 'none';
        }
    };

    // Validation functions
    function validatePFNumber(pfNumber) {
        const pattern = /^\d{5}$/;
        return pattern.test(pfNumber);
    }

    async function isPFNumberUnique(pfNumber) {
        const response = await fetch(`/employees/pf_number/${pfNumber}`);
        return response.status === 404; // Return true if PF number does not exist
    }

    // Handle add form submission
    addForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const pfNumber = document.getElementById('add-pf_number').value;

        if (!validatePFNumber(pfNumber)) {
            alert('PF Number must be exactly five digits.');
            return;
        }

        if (!(await isPFNumberUnique(pfNumber))) {
            alert('PF Number must be unique.');
            return;
        }

        const employee = {
            pf_number: pfNumber,
            first_name: document.getElementById('add-first_name').value,
            last_name: document.getElementById('add-last_name').value,
            gender: document.querySelector('input[name="add-gender"]:checked').value,
            date_of_birth: document.getElementById('add-date_of_birth').value,
            email: document.getElementById('add-email').value,
            phone_number: document.getElementById('add-phone_number').value,
            preferred_notification_method: document.getElementById('add-preferred_notification_method').value,
            department: document.getElementById('add-department').value
        };

        fetch('/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employee)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Employee added successfully') {
                addModal.style.display = 'none';
                location.reload();
            } else {
                alert('Failed to add employee');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});

