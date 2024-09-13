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
        // Handle actions in the modal
        editBtn.onclick = function () {
            const selectedRows = document.querySelectorAll('.select-row:checked');
            if (selectedRows.length === 1) {
                // Open edit modal or handle edit functionality
                console.log('Edit action for:', selectedRows[0].closest('tr'));
            } else {
                alert('Please select exactly one row to edit.');
            }
        }

        deleteBtn.onclick = function () {
            const selectedRows = document.querySelectorAll('.select-row:checked');
            if (selectedRows.length > 0) {
                // Handle delete functionality
                console.log('Delete action for:', Array.from(selectedRows).map(row => row.closest('tr')));
                // Optional: Confirm deletion
            } else {
                alert('Please select at least one row to delete.');
            }
        }
    });






// Variables to access the modal and close button
const editModal = document.getElementById('editModal');
const closeModalButton = document.getElementById('close');
const editForm = document.getElementById('editForm');

// When Edit button is clicked, show the modal and populate the form with selected employee data
document.getElementById('editBtn').addEventListener('click', () => {
    const selectedRow = document.querySelector('.select-row:checked'); // Get the selected row
    if (selectedRow) {
        const row = selectedRow.closest('tr'); // Get the row element of the selected radio

        // Populate the form with the employee data
        document.getElementById('edit-pf_number').value = row.cells[1].textContent;
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

// Prevent form submission (You can later handle saving the changes)
editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    // Logic to save changes or send an API request goes here.
    alert('Changes saved!'); // Temporary feedback
    editModal.style.display = 'none'; // Close the modal after submission
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
icon.onclick = function() {
    modal.style.display = "block";
}

// When the close button is clicked, close the modal
closeBtn.onclick = function() {
    modal.style.display = "none";
}

// Close the modal if the user clicks outside of the modal content
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}