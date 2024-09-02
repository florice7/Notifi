document.addEventListener('DOMContentLoaded', () => {
    // Fetch and populate the table with all employees by default
    fetch('/employees')
        .then(response => response.json())
        .then(data => {
            populateTable(data);  // Populate the table with fetched employees
            updatePieChart(data);
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
        const isDepartmentMatch = !department || employee.department.toLowerCase().includes(department);
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
        const isDepartmentMatch = !department || employee.department.toLowerCase().includes(department);
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


let employeePieChart;

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
                'rgba(255, 206, 100, 0.6)',
                'rgba(255, 99, 132, 0.6)'
            ],
            borderColor: [ 
                'rgba(255, 206, 100, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
     }]
    };

    const ctx = document.getElementById('employeePieChart').getContext('2d');
    
    if(employeePieChart){
        employeePieChart.destroy();
    }
    employeePieChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: 'true',
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });
}

