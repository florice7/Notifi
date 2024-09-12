document.addEventListener('DOMContentLoaded', () => {
    // Fetch and populate the table with all employees by default
    fetch('/employees')
        .then(response => response.json())
        .then(data => {
            // populateTable(data); 
            updatePieChart(data);
            updateAgePieChart(data);
            fetchEmailStatus();
            updateCircularProgress(data.length, data.length);
            updateAverageAgeCard(data);
            updateAverageMaleAgeCard(data);
            updateAverageFemaleAgeCard(data);
            updateTotalEmployeesCard(data);
            createDepartmentAgeChart(data);
        })
        .catch(error => console.error('Error fetching data:', error));
});

function updateAverageAgeCard(employees) {
    // Calculate the total age and average age
    const totalAge = employees.reduce((sum, employee) => {
        const dob = new Date(employee.date_of_birth);
        const age = new Date().getFullYear() - dob.getFullYear();
        return sum + age;
    }, 0);
    
    const averageAge = totalAge / employees.length;

    // Update the average age in the card
    const averageAgeElement = document.getElementById('averageAge');
    averageAgeElement.textContent = averageAge.toFixed(1); // Display the average age rounded to 1 decimal place
}


function updateAverageMaleAgeCard(employees) {
    // Filter males from the employees list
    const maleEmployees = employees.filter(employee => employee.gender === 'Male');
    
    if (maleEmployees.length === 0) {
        // Handle the case where there are no male employees
        document.getElementById('averageMaleAge').textContent = 'N/A';
        return;
    }

    // Calculate the total age and average age for male employees
    const totalMaleAge = maleEmployees.reduce((sum, employee) => {
        const dob = new Date(employee.date_of_birth);
        const age = new Date().getFullYear() - dob.getFullYear();
        return sum + age;
    }, 0);
    
    const averageMaleAge = totalMaleAge / maleEmployees.length;

    // Update the average male age in the card
    const averageMaleAgeElement = document.getElementById('averageMaleAge');
    averageMaleAgeElement.textContent = averageMaleAge.toFixed(1); // Display the average age rounded to 1 decimal place
}

function updateAverageFemaleAgeCard(employees) {
    // Filter females from the employees list
    const femaleEmployees = employees.filter(employee => employee.gender === 'Female');
    
    if (femaleEmployees.length === 0) {
        // Handle the case where there are no female employees
        document.getElementById('averageFemaleAge').textContent = 'N/A';
        return;
    }

    // Calculate the total age and average age for female employees
    const totalFemaleAge = femaleEmployees.reduce((sum, employee) => {
        const dob = new Date(employee.date_of_birth);
        const age = new Date().getFullYear() - dob.getFullYear();
        return sum + age;
    }, 0);
    
    const averageFemaleAge = totalFemaleAge / femaleEmployees.length;

    // Update the average male age in the card
    const averageFemaleAgeElement = document.getElementById('averageFemaleAge');
    averageFemaleAgeElement.textContent = averageFemaleAge.toFixed(1); // Display the average age rounded to 1 decimal place
}


function updateTotalEmployeesCard(employees) {
    // Calculate total number of employees
    const totalEmployees = employees.length;

    // Calculate number of male and female employees
    const maleEmployeesCount = employees.filter(employee => employee.gender === 'Male').length;
    const femaleEmployeesCount = employees.filter(employee => employee.gender === 'Female').length;

    // Calculate percentages
    const malePercentage = ((maleEmployeesCount / totalEmployees) * 100).toFixed(2);
    const femalePercentage = ((femaleEmployeesCount / totalEmployees) * 100).toFixed(2);

    // Update the card with calculated values
    document.getElementById('totalEmployees').textContent = totalEmployees;
    document.getElementById('maleEmployees').textContent = maleEmployeesCount;
    document.getElementById('femaleEmployees').textContent = femaleEmployeesCount;
    document.getElementById('malePercentage').textContent = `${malePercentage}%`;
    document.getElementById('femalePercentage').textContent = `${femalePercentage}%`;
}




document.getElementById('analyticsForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const gender = document.getElementById('gender').value;
    const department = document.getElementById('department').value.trim().toLowerCase();

    fetch('/employees')
        .then(response => response.json())
        .then(data => {
            const employees = data;
            let filteredEmployees = [];

            
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

            // populateTable(filteredEmployees);
            updatePieChart(filteredEmployees);
            updateAgePieChart(filteredEmployees);
            updateCircularProgress(filteredEmployees.length, employees.length);
        })
        .catch(error => console.error('Error fetching data:', error));
});


// document.querySelectorAll('input[name="searchType"]').forEach((elem) => {
//     elem.addEventListener('change', function() {
//         const ageInputs = document.getElementById('ageInputs');
//         const dobInputs = document.getElementById('dobInputs');
//         if (this.value === 'age') {
//             ageInputs.style.display = 'block';
//             dobInputs.style.display = 'none';
//         } else {
//             ageInputs.style.display = 'none';
//             dobInputs.style.display = 'block';
//         }
//     });
// });


// function filterEmployeesByDOB(employees, startDate, endDate, gender, department) {
//     return employees.filter(employee => {
//         const isGenderMatch = (gender === 'both') || (employee.gender.toLowerCase() === gender.toLowerCase());
//         const isDepartmentMatch = !department || employee.department.toLowerCase().startsWith(department);
//         if (!employee.date_of_birth) {
//             return isGenderMatch && isDepartmentMatch;
//         }
//         const dob = new Date(employee.date_of_birth);
//         return dob >= startDate && dob <= endDate && isGenderMatch && isDepartmentMatch;
//     });
// }




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

// function displayResultsCount(filteredCount, totalCount) {
//     const percentage = ((filteredCount / totalCount) * 100).toFixed(2);
//     document.getElementById('resultsCount').textContent = `Results: ${filteredCount} (${percentage}% of total)`;
// }


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

    const totalEmployees = genderCount.male + genderCount.female;

    const data = {
        labels: ['Male', 'Female'],
        datasets: [{
            label: 'Gender Distribution',
            data: [genderCount.male, genderCount.female],
            backgroundColor: [
                'rgba(195, 180, 180, 1)',
                'rgba(106, 4, 15, 0.8)'
            ],
            borderColor: [
                'rgba(195, 180, 180, 1)',
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
                    labels: {
                        font: {
                            family: 'Poppins',  // Set Poppins font for the legend
                            size: 14,
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        // Show actual numbers in the tooltip
                        label: function(tooltipItem) {
                            const count = data.datasets[0].data[tooltipItem.dataIndex];
                            const label = data.labels[tooltipItem.dataIndex];
                            return `${label}: ${count} people`;
                        }
                    }
                },
                datalabels: {
                    // Show percentage in each pie slice
                    formatter: (value, context) => {
                        const percentage = ((value / totalEmployees) * 100).toFixed(1);
                        return `${percentage}%`;
                    },
                    color: 'black', // Text color
                    font: {
                        family: 'Poppins', 
                        weight: 'bold',
                        size: 35 
                    },
                    anchor: 'center', 
                    align: 'center', 
                    offset: 0, 
                }
            }
        },
        plugins: [ChartDataLabels] // Include the datalabels plugin
    });
}





let agePieChart; // Age Chart

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

    const totalEmployees = aboveAverage + belowAverage;

    const data = {
        labels: [
            `Above Average Age (${averageAge.toFixed(2)} years)`,
            `Below Average Age (${averageAge.toFixed(2)} years)`
        ],
        datasets: [{
            label: 'Age Distribution',
            data: [aboveAverage, belowAverage],
            backgroundColor: [
                'rgba(106, 4, 15, 0.8)', 
                'rgba(195, 180, 180, 1)'   
            ],
            borderColor: [
                'rgba(106, 4, 15, 0.8)',
                'rgba(195, 180, 180, 1)'
            ],
            borderWidth: 1
        }]
    };

    const ctx = document.getElementById('agePieChart').getContext('2d');

    // Destroy existing chart if it exists before creating a new one
    if (agePieChart) {
        agePieChart.destroy();
    }

    // Create a new chart with updated options
    agePieChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1, // Ensures a square chart
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Poppins',  // Set Poppins font for the legend
                            size: 14,
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        // Show actual numbers in the tooltip
                        label: function(tooltipItem) {
                            const count = data.datasets[0].data[tooltipItem.dataIndex];
                            const label = data.labels[tooltipItem.dataIndex];
                            return `${label}: ${count} people`;
                        }
                    }
                },
                datalabels: {
                    // Show percentage in each pie slice
                    formatter: (value, context) => {
                        const percentage = ((value / totalEmployees) * 100).toFixed(1);
                        return `${percentage}%`;
                    },
                    color: 'black', // Text color
                    font: {
                        family: 'Poppins', // Poppins font
                        weight: 'bold',
                        size: 35 // Large font size
                    },
                    anchor: 'center', 
                    align: 'center', 
                    offset: 0, 
                }
            }
        },
        plugins: [ChartDataLabels] 
    });
}



let emailStatusChart; 

function updateEmailStatusChart(data) {
    const totalAttempts = data.total_attempts;

    const emailData = {
        labels: ['Successful', 'Failed', 'Successful Retries', 'Failed Retries'],
        datasets: [{
            data: [
                (data.successful_first_attempt / totalAttempts) * 100, 
                (data.failed_first_attempt / totalAttempts) * 100, 
                (data.successful_retry / totalAttempts) * 100, 
                (data.failed_retry / totalAttempts) * 100
            ],
            backgroundColor: [
                'rgba(106, 4, 15, 0.8)', 
                'rgba(10, 10, 10, 0.9)',  
                'rgba(195, 180, 180, 1)',  
                'rgba(200, 200, 0, 0.8)'   
            ],
            borderColor: [
                'rgba(106, 4, 15, 0.8)',
                'rgba(10, 10, 10, 0.9)',
                'rgba(20, 150, 150, 0.8)',
                'rgba(200, 200, 0, 0.8)'
            ],
            borderWidth: 1
        }]
    };

    // Destroy existing chart if it exists
    if (emailStatusChart) {
        emailStatusChart.destroy();
    }

    const ctx = document.getElementById('emailStatusChart').getContext('2d');
    emailStatusChart = new Chart(ctx, {
        type: 'pie',
        data: emailData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Poppins',  // Set Poppins font for the legend
                            size: 14,
                        }
                    }
                },
                datalabels: {
                    formatter: (value, ctx) => {
                        return value.toFixed(2) + '%'; // Show percentage on the chart
                    },
                    color: '#fff',  
                    font: {
                        family: 'Poppins',  
                        weight: 'bold',
                        size: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const value = emailData.datasets[0].data[tooltipItem.dataIndex];
                            return `${emailData.labels[tooltipItem.dataIndex]}: ${value.toFixed(2)}%`;
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]  
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


function updateCircularProgress(filteredCount, totalCount) {
    const percentage = ((filteredCount / totalCount) * 100).toFixed(2);
    const progressCircle = document.getElementById('progressCircle');
    const circleRadius = 160;  // Updated radius for the red circle
    const circumference = 2 * Math.PI * circleRadius;

    // Set the circle's total circumference (used for the stroke-dasharray)
    progressCircle.style.strokeDasharray = `${circumference}`;

    // Calculate the stroke-dashoffset based on the percentage
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    // Update the total count and percentage
    document.getElementById('totalCountDisplay').textContent = `${filteredCount} People`;
    document.getElementById('percentageDisplay').textContent = `${percentage}%`;
}


function createDepartmentAgeChart(employees) {
    // Group employees by department and gender and calculate average age
    const departments = {};

    employees.forEach(employee => {
        const department = employee.department;
        const gender = employee.gender;
        const dob = new Date(employee.date_of_birth);
        const age = new Date().getFullYear() - dob.getFullYear();

        if (!departments[department]) {
            departments[department] = { Male: [], Female: [] };
        }
        departments[department][gender].push(age);
    });

    // Calculate average age per department and gender
    const departmentNames = Object.keys(departments);
    const maleAges = [];
    const femaleAges = [];

    departmentNames.forEach(department => {
        const maleAgesInDepartment = departments[department]['Male'];
        const femaleAgesInDepartment = departments[department]['Female'];

        const averageMaleAge = maleAgesInDepartment.reduce((a, b) => a + b, 0) / maleAgesInDepartment.length || 0;
        const averageFemaleAge = femaleAgesInDepartment.reduce((a, b) => a + b, 0) / femaleAgesInDepartment.length || 0;

        maleAges.push(averageMaleAge);
        femaleAges.push(averageFemaleAge);
    });

    // Create the chart
    const ctx = document.getElementById('departmentAgeChart').getContext('2d');
    const departmentAgeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: departmentNames,
            datasets: [
                {
                    label: 'Male Average Age',
                    data: maleAges,
                    backgroundColor: 'rgba(106, 4, 15, 0.8)', 
                    barThickness: 60, 
                    categoryPercentage: 0.4, 
                    barPercentage: 0.2
                },
                {
                    label: 'Female Average Age',
                    data: femaleAges,
                    backgroundColor: 'rgba(195, 180, 180, 1)', // Female color
                    barThickness: 60, // Width of the bar
                    categoryPercentage: 0.4, // Adjusts the width of bars relative to the group
                    barPercentage: 0.2// Adjusts the width of bars relative to the group
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: false, // Ensure the bars are side by side
                    title: {
                        display: true,
                        text: 'Departments',
                        font: {
                            family: 'Poppins',
                            size: 16
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Age',
                        font: {
                            size: 16
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

