document.addEventListener('DOMContentLoaded', () => {
    // Populate the table with all employees by default
    populateTable('all');
    fetchEmailStatus();
    // Add event listener for the filter dropdown
    const filterDropdown = document.getElementById('birthdayFilter');
    filterDropdown.addEventListener('change', (e) => {
        const selectedFilter = e.target.value;

        resetTable();
        
        populateTable(selectedFilter);
        fetchEmailStatus();
    });
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('import-form').addEventListener('submit', function(event) {
        event.preventDefault();  // Prevent the form from submitting in the traditional way

        const fileInput = document.getElementById('file-upload');
        if (!fileInput.files.length) {
            alert('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        fetch('/import', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.duplicates && data.duplicates.length > 0) {
                const confirmUpdate = confirm(`Some records already exist. Do you want to update them?`);
                if (confirmUpdate) {
                    fetch('/update', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(updateData => {
                        alert(updateData.message);
                    })
                    .catch(error => {
                        console.error('Error updating records:', error);
                    });
                }
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error importing file:', error);
        });
    });
});

function populateTable(filter = 'all') {
    fetch('/employees')
        .then(response => response.json())
        .then(data => {
            const today = new Date();
            const tomorrow = new Date(today);
            const nextWeek = new Date(today);

            tomorrow.setDate(today.getDate() + 1);
            nextWeek.setDate(today.getDate() + 7);

            const tableBody = document.querySelector('#employeeTable tbody');

            tableBody.innerHTML = data
                .map(employee => {
                    const dob = new Date(employee.date_of_birth);
                    const isToday = dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
                    const isTomorrow = dob.getDate() === tomorrow.getDate() && dob.getMonth() === tomorrow.getMonth();

                    // Check if the employee's birthday falls within the next 7 days
                    const dobThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                    const isNextWeek = dobThisYear >= today && dobThisYear <= nextWeek;

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
                    }
                    
                    if (showRow) {
                        return `
                            <tr>
                                <td>${employee.pf_number}</td>
                                <td>${employee.first_name}</td>
                                <td>${employee.last_name}</td>
                                <td>${employee.gender}</td>
                                <td>${employee.date_of_birth}</td>
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
                    }
                })
                .join('');

            // Reattach event listeners for the edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', handleEdit);
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', handleDelete);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}




function resetTable() {
    const searchInput = document.getElementById('searchInput');
    const filterDropdown = document.getElementById('birthdayFilter');
    populateTable('all');  // Re-populate the table with the default filter
}


document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('change', (e) => {
        const selectedFilter = e.target.value;
        populateTable(selectedFilter);
    });
});


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


// Get elements
const confirmationDialog = document.getElementById('confirmationDialog');
const confirmationMessage = document.getElementById('confirmationMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

// Function to show the custom confirmation dialog
function showCustomConfirm(message, callback) {
    console.log('Custom confirm triggered'); // Check if this logs
    confirmationMessage.textContent = message;
    confirmationDialog.style.display = 'flex'; // Ensure display is set to 'flex'
    console.log('Dialog displayed'); // Check if this logs

    confirmYes.onclick = () => {
        confirmationDialog.style.display = 'none';
        callback(true);
    };

    confirmNo.onclick = () => {
        confirmationDialog.style.display = 'none';
        callback(false);
    };
}


// Example usage with the handleDelete function
function handleDelete(event) {
    const row = event.target.closest('tr');
    const pfNumber = event.target.dataset.id;
    const firstName = row.querySelector('td:nth-child(2)').textContent;
    const lastName = row.querySelector('td:nth-child(3)').textContent;

    showCustomConfirm(`Are you sure you want to delete ${firstName} ${lastName}?`, confirmed => {
        if (confirmed) {
            fetch(`/employees/${pfNumber}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    row.remove();
                } else {
                    console.error('Failed to delete employee');
                }
            })
            .catch(error => console.error('Error deleting employee:', error));
        }
    });
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

function resetDropdown() {
    const filterDropdown = document.getElementById('birthdayFilter');
    filterDropdown.selectedIndex = 0;  
}


document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    searchButton.addEventListener('click', () => {
        const searchQuery = searchInput.value.trim();

        if (searchButton.classList.contains('clear-button')) {
            // Reset the table if the clear button is clicked
            resetDropdown();
            resetTable();
            
            searchButton.innerHTML = '<i class="fas fa-search"></i>'; // Change back to search icon
            searchButton.classList.remove('clear-button');
        } else {
            // Fetch and filter employees based on the search query
            if (searchQuery) {
                fetch('/employees')
                    .then(response => response.json())
                    .then(data => {
                        const filteredEmployees = data.filter(employee => {
                            const pfMatch = String(employee.pf_number).startsWith(searchQuery);
                            const firstNameMatch = employee.first_name.toLowerCase().includes(searchQuery.toLowerCase());
                            const lastNameMatch = employee.last_name.toLowerCase().includes(searchQuery.toLowerCase());

                            return pfMatch || firstNameMatch || lastNameMatch;
                        });

                        resetDropdown();
                        populateTableWithFilteredEmployees(filteredEmployees);

                        // Change the search button to a clear button
                        searchButton.innerHTML = '&times;'; // Change the icon to a cross
                        searchButton.classList.add('clear-button'); // Add a class to identify the clear state
                    })
                    .catch(error => {
                        alert(error.message);
                    });
            } else {
                alert("Please enter a search term.");
            }
        }
    });
});

function populateTableWithFilteredEmployees(employees) {
    const tableBody = document.querySelector('#employeeTable tbody');

    tableBody.innerHTML = employees.map(employee => `
        <tr>
            <td>${employee.pf_number}</td>
            <td>${employee.first_name}</td>
            <td>${employee.last_name}</td>
            <td>${employee.gender}</td>
            <td>${employee.date_of_birth}</td>
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
    `).join('');

    // Add event listeners for the edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', handleEdit);
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });
}

function resetTable() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';  // Clear the search input

    // Clear the table before repopulating
    const tableBody = document.querySelector('#employeeTable tbody');
    tableBody.innerHTML = '';  // Clear existing rows

    // Repopulate the table with all employees
    populateTable('all');
}


// Handle opening and closing modals;;dropdown menu
function openAddModal() {
    document.getElementById('addModal').style.display = 'block';
}

document.getElementById('close').onclick = function() {
    document.getElementById('addModal').style.display = 'none';
}


document.getElementById('addForm').onsubmit = function(event) {
    event.preventDefault(); // Prevent form from submitting the default way
    console.log('Form submitted');
}

document.addEventListener('DOMContentLoaded', function() {
    // Toggle Import dropdown
    document.getElementById('import-link').addEventListener('click', function(event) {
        event.preventDefault(); 
        const importDropdown = document.getElementById('import-dropdown');
        const importContent = importDropdown.querySelector('.import-content');
        importContent.style.display = (importContent.style.display === 'block') ? 'none' : 'block';
    });

    // Toggle Extract dropdown
    document.querySelector('#extract-dropdown > a').addEventListener('click', function(event) {
        event.preventDefault(); 
        const extractDropdown = document.getElementById('extract-dropdown');
        const extractContent = extractDropdown.querySelector('.extract-content');
        extractContent.style.display = (extractContent.style.display === 'block') ? 'none' : 'block';
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const importDropdown = document.getElementById('import-dropdown');
        const extractDropdown = document.getElementById('extract-dropdown');
        
        if (!importDropdown.contains(event.target) && !extractDropdown.contains(event.target)) {
            importDropdown.querySelector('.import-content').style.display = 'none';
            extractDropdown.querySelector('.extract-content').style.display = 'none';
        }
    });

    // Show the selected file name and remove button
    document.getElementById('file-upload').addEventListener('change', function(event) {
        const fileNameElement = document.getElementById('file-name');
        const removeFileButton = document.getElementById('remove-file');
        const fileInput = event.target;

        if (fileInput.files.length > 0) {
            fileNameElement.textContent = fileInput.files[0].name;
            removeFileButton.style.display = 'inline-block';
        } else {
            fileNameElement.textContent = '';
            removeFileButton.style.display = 'none';
        }
    });

    // Remove the selected file
    document.getElementById('remove-file').addEventListener('click', function() {
        const fileInput = document.getElementById('file-upload');
        const fileNameElement = document.getElementById('file-name');
        const removeFileButton = document.getElementById('remove-file');

        fileInput.value = ''; 
        fileNameElement.textContent = '';
        removeFileButton.style.display = 'none'; 
    });
});


document.getElementById('extract-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const gender = document.getElementById('gender').value;

    // Send the data to the server
    fetch('/extract', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startDate, endDate, gender })
    })
    .then(response => response.blob())
    .then(blob => {
        // Create a link element, trigger a download and then remove it
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Notifi_Birthday_Reports.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(error => console.error('Error extracting data:', error));
});


function fetchEmailStatus() {
    fetch('/email-status')
        .then(response => response.json())
        .then(data => {
            updateEmailStatusChart(data);
        })
        .catch(error => console.error('Error fetching email status data:', error));
}

function updateEmailStatusChart(data) {
    const ctx = document.getElementById('emailStatusChart').getContext('2d');

    const emailData = {
        labels: ['Successful Emails', 'Failed Emails'],
        datasets: [{
            data: [data.successful_emails, data.failed_emails],
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'pie',
        data: emailData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });
}

function fetchRetryStatus() {
    fetch('/email-retry-status')
        .then(response => response.json())
        .then(data => {
            updateRetryStatusChart(data);
        })
        .catch(error => console.error('Error fetching retry status data:', error));
}

function updateRetryStatusChart(data) {
    const ctx = document.getElementById('retryStatusChart').getContext('2d');

    const retryData = {
        labels: ['Successful Retries', 'Failed Retries'],
        datasets: [{
            data: [data.successful_retries, data.failed_retries],
            backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 159, 64, 0.6)'],
            borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 159, 64, 1)'],
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'pie',
        data: retryData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });
}
