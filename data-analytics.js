document.addEventListener('DOMContentLoaded', () => {
    // Fetch and populate the table with all employees by default
    fetch('/employees')
        .then(response => response.json())
        .then(data => {
            populateTable(data);  // Populate the table with fetched employees
            updatePieChart(data);
            updateAgePieChart(data);
            fetchEmailStatus();
            fetchRetryStatus();
        })
        .catch(error => console.error('Error fetching data:', error));
});




document.getElementById('analyticsForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const gender = document.getElementById('gender').value;
    const department = document.getElementById('department').value.trim().toLowerCase();

    fetch('/employees')
        .then(response => response.json())
        .then(data => {
            const employees = data;
            let filteredEmployees = [];

            if (searchType === 'age') {
                let minAge = document.getElementById('minAge').value;
                let maxAge = document.getElementById('maxAge').value;
                
                // Apply default values if empty
                minAge = minAge ? parseInt(minAge) : 16;
                maxAge = maxAge ? parseInt(maxAge) : 100;

                if (minAge > maxAge) {
                    alert('Minimum age cannot be greater than maximum age.');
                    return;
                }

                filteredEmployees = filterEmployeesByAge(employees, minAge, maxAge, gender, department);

            } else {
                let startDate = document.getElementById('startDate').value;
                let endDate = document.getElementById('endDate').value;

                // Apply default values if empty
                startDate = startDate ? new Date(startDate) : new Date('1920-01-01');
                endDate = endDate ? new Date(endDate) : new Date();

                if (startDate > endDate) {
                    alert('Start date cannot be greater than end date.');
                    return;
                }

                filteredEmployees = filterEmployeesByDOB(employees, startDate, endDate, gender, department);
            }

            populateTable(filteredEmployees);
            updatePieChart(filteredEmployees);
            updateAgePieChart(filteredEmployees);

            displayResultsCount(filteredEmployees.length, employees.length);
        })
        .catch(error => console.error('Error fetching data:', error));
});


document.querySelectorAll('input[name="searchType"]').forEach((elem) => {
    elem.addEventListener('change', function() {
        const ageInputs = document.getElementById('ageInputs');
        const dobInputs = document.getElementById('dobInputs');
        if (this.value === 'age') {
            ageInputs.style.display = 'block';
            dobInputs.style.display = 'none';
        } else {
            ageInputs.style.display = 'none';
            dobInputs.style.display = 'block';
        }
    });
});


function filterEmployeesByDOB(employees, startDate, endDate, gender, department) {
    return employees.filter(employee => {
        const isGenderMatch = (gender === 'both') || (employee.gender.toLowerCase() === gender.toLowerCase());
        const isDepartmentMatch = !department || employee.department.toLowerCase().startsWith(department);
        if (!employee.date_of_birth) {
            return isGenderMatch && isDepartmentMatch;
        }
        const dob = new Date(employee.date_of_birth);
        return dob >= startDate && dob <= endDate && isGenderMatch && isDepartmentMatch;
    });
}




function filterEmployeesByAge(employees, minAge, maxAge, gender, department) {
    const today = new Date();
    return employees.filter(employee => {
        const isGenderMatch = (gender === 'both') || (employee.gender.toLowerCase() === gender.toLowerCase());
        const isDepartmentMatch = !department || employee.department.toLowerCase().startsWith(department);
        if (!employee.date_of_birth) {
            return isGenderMatch && isDepartmentMatch;
        }
        const dob = new Date(employee.date_of_birth);
        const age = today.getFullYear() - dob.getFullYear();
        return age >= minAge && age <= maxAge && isGenderMatch && isDepartmentMatch;
    });
}


function populateTable(employees) {
    const tableBody = document.querySelector('#employeeTable tbody');
    tableBody.innerHTML = employees.length > 0
        ? employees.map(employee => `
            <tr>
                <td>${employee.pf_number}</td>
                <td>${employee.first_name}</td>
                <td>${employee.last_name}</td>
                <td>${employee.gender}</td>
                <td>${employee.date_of_birth ? employee.date_of_birth : 'N/A'}</td>
                <td>${employee.email}</td>
                <td>${employee.phone_number}</td>
                <td>${employee.department}</td>
            </tr>
        `).join('')
        : `<tr><td colspan="8">No results found</td></tr>`;
}

function displayResultsCount(filteredCount, totalCount) {
    const percentage = ((filteredCount / totalCount) * 100).toFixed(2);
    document.getElementById('resultsCount').textContent = `Results: ${filteredCount} (${percentage}% of total)`;
}


let employeePieChart; //Gender Chart

function updatePieChart(filteredEmployees) {
    const genderCount = {
        male: 0,
        female: 0
    };

    filteredEmployees.forEach(employee => {
        const gender = employee.gender.toLowerCase();
        if (gender === 'male') genderCount.male++;
        else genderCount.female++;
    });

    const data = {
        labels: ['Male', 'Female'],
        datasets: [{
            label: 'Gender Distribution',
            data: [genderCount.male, genderCount.female],
            backgroundColor: [
                'rgba(10, 10, 10, 0.9)',
                'rgba(106, 4, 15, 0.8)'
            ],
            borderColor: [
                'rgba(10, 10, 10, 0.9)',
                'rgba(106, 4, 15, 0.8)'
            ],
            borderWidth: 1
        }]
    };

    const ctx = document.getElementById('employeePieChart').getContext('2d');

    // Destroy existing chart if it exists before creating a new one
    if (employeePieChart) {
        employeePieChart.destroy();
    }

    // Create a new chart with updated options
    employeePieChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1, // Ensures a square chart
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });
}



let agePieChart;

function updateAgePieChart(filteredEmployees) {
    const totalAge = filteredEmployees.reduce((sum, employee) => {
        const dob = new Date(employee.date_of_birth);
        const age = new Date().getFullYear() - dob.getFullYear();
        return sum + age;
    }, 0);
    const averageAge = totalAge / filteredEmployees.length;

    let aboveAverage = 0;
    let belowAverage = 0;

    filteredEmployees.forEach(employee => {
        const dob = new Date(employee.date_of_birth);
        const age = new Date().getFullYear() - dob.getFullYear();
        if (age >= averageAge) {
            aboveAverage++;
        } else {
            belowAverage++;
        }
    });

    const data = {
        labels: [
            `Above Average Age (${averageAge.toFixed(2)} years)`,
            `Below Average Age (${averageAge.toFixed(2)} years)`
        ],
        datasets: [{
            label: 'Age Distribution',
            data: [aboveAverage, belowAverage],
            backgroundColor: [
                'rgba(106, 4, 15, 0.8)', // Blue
                'rgba(10, 10, 10, 0.9)'  // Orange
            ],
            borderColor: [
                'rgba(106, 4, 15, 0.8)',
                'rgba(10, 10, 10, 0.9)'
            ],
            borderWidth: 1
        }]
    };

    const ctx = document.getElementById('agePieChart').getContext('2d');

    if (agePieChart) {
        agePieChart.destroy();
    }

    agePieChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });
}



let emailStatusChart; // Declare the variable at a higher scope

function updateEmailStatusChart(data) {
    const ctx = document.getElementById('emailStatusChart').getContext('2d');

    const emailData = {
        labels: ['Successful Emails', 'Failed Emails'],
        datasets: [{
            data: [data.successful_emails, data.failed_emails],
            backgroundColor: ['rgba(106, 4, 15, 0.8)', 'rgba(10, 10, 10, 0.9)'],
            borderColor: ['rgba(106, 4, 15, 0.8)', 'rgba(10, 10, 10, 0.9)'],
            borderWidth: 1
        }]
    };

    // Destroy existing chart if it exists
    if (emailStatusChart) {
        emailStatusChart.destroy();
    }

    // Create a new chart
    emailStatusChart = new Chart(ctx, {
        type: 'pie',
        data: emailData,
        options: {
            responsive: false,
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });
}


function fetchEmailStatus() {
    fetch('/email-status')
        .then(response => response.json())
        .then(data => {
            updateEmailStatusChart(data);
        })
        .catch(error => console.error('Error fetching email status data:', error));
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
            backgroundColor: ['rgba(106, 4, 15, 0.8)', 'rgba(10, 10, 10, 0.9)'],
            borderColor: ['rgba(106, 4, 15, 0.8)', 'rgba(10, 10, 10, 0.9)'],
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
