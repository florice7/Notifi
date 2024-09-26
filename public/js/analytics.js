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



document.addEventListener('DOMContentLoaded', function () {
    let allEmployeeData = []; // Variable to store all employee data
    let allAdminData = []; // Variable to store all admin data

    function fetchAllEmployees() {
        fetch('/employees')
            .then(response => response.json())
            .then(data => {
                allEmployeeData = data; // Store data globally
                updateCardData(); // Initial update with all data
                createAgeGenderDisparityChart(allEmployeeData);
                createPeopleCountChart(allEmployeeData);
                // updateEmailStatusChart();
            })
            .catch(error => console.error('Error fetching employee data:', error));
    }

    function fetchAllAdmins() {
        fetch('/getAdmins')
            .then(response => response.json())
            .then(data => {
                allAdminData = data; // Store admin data globally
                updateAdminCard(); // Update admin card data
            })
            .catch(error => console.error('Error fetching admin data:', error));
    }



    let peopleCountChart; // Declare chart outside the function to reuse it

    function createPeopleCountChart(data) {
        // Destroy previous chart instance if it exists
        if (peopleCountChart) {
            peopleCountChart.destroy();
        }
    
        // Prepare chart data
        const departments = [...new Set(data.map(employee => employee.department))]; // Unique departments
        const maleCounts = [];
        const femaleCounts = [];
    
        departments.forEach(department => {
            const malesInDept = data.filter(emp => emp.department === department && emp.gender.toLowerCase() === 'male');
            const femalesInDept = data.filter(emp => emp.department === department && emp.gender.toLowerCase() === 'female');
    
            maleCounts.push(malesInDept.length); // Number of males in each department
            femaleCounts.push(femalesInDept.length); // Number of females in each department
        });
    
        const ctx = document.getElementById('graphCanvas2').getContext('2d');
        peopleCountChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: departments,
                datasets: [
                    {
                        label: 'Male',
                        data: maleCounts,
                        backgroundColor: '#BC5449',
                        borderRadius: 18, // Add slight curve to the bars
                        barPercentage: 1.0, // Keep bars attached within the same department
                        categoryPercentage: 0.6, // Create separation between departments
                    },
                    {
                        label: 'Female',
                        data: femaleCounts,
                        backgroundColor: '#710C04',
                        borderRadius: 18, // Add slight curve to the bars
                        barPercentage: 1.0, // Keep bars attached within the same department
                        categoryPercentage: 0.6, // Create separation between departments
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow the chart to fit the height properly
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of People',
                            color: '#000000', // Solid black for Y-axis title
                            font: {
                                family: 'Poppins', // Poppins for Y-axis title
                                size: 14,
                                weight: '600'
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Poppins', // Poppins for Y-axis labels
                                size: 12
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Department',
                            color: '#000000', // Solid black for X-axis title
                            font: {
                                family: 'Poppins', // Poppins for X-axis title
                                size: 14,
                                weight: '600'
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Poppins', // Poppins for X-axis labels
                                size: 12
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: 'Poppins', // Poppins for legend labels
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
    






    let ageGenderChart; // Declare chart outside the function to reuse it

function createAgeGenderDisparityChart(data) {
    // Destroy previous chart instance if it exists
    if (ageGenderChart) {
        ageGenderChart.destroy();
    }

    // Prepare chart data
    const departments = [...new Set(data.map(employee => employee.department))]; // Unique departments
    const maleAges = [];
    const femaleAges = [];

    departments.forEach(department => {
        const malesInDept = data.filter(emp => emp.department === department && emp.gender.toLowerCase() === 'male');
        const femalesInDept = data.filter(emp => emp.department === department && emp.gender.toLowerCase() === 'female');

        const avgMaleAge = malesInDept.length ? (malesInDept.reduce((acc, emp) => acc + (new Date().getFullYear() - new Date(emp.date_of_birth).getFullYear()), 0) / malesInDept.length) : 0;
        const avgFemaleAge = femalesInDept.length ? (femalesInDept.reduce((acc, emp) => acc + (new Date().getFullYear() - new Date(emp.date_of_birth).getFullYear()), 0) / femalesInDept.length) : 0;

        maleAges.push(avgMaleAge);
        femaleAges.push(avgFemaleAge);
    });

    const ctx = document.getElementById('graphCanvas1').getContext('2d');
    ageGenderChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: departments,
            datasets: [
                {
                    label: 'Male',
                    data: maleAges,
                    backgroundColor: '#BC5449',
                    barPercentage: 1.0, // Keep bars attached within the same department
                    borderRadius: 18,
                    categoryPercentage: 0.6, // Separation between departments
                },
                {
                    label: 'Female',
                    data: femaleAges,
                    backgroundColor: '#710C04',
                    barPercentage: 1.0, // Keep bars attached within the same department
                    borderRadius: 18,
                    categoryPercentage: 0.6, // Separation between departments
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Age',
                        color: '#000000', // Solid black for Y-axis title
                        font: {
                            family: 'Poppins',
                            size: 14,
                            weight: '600'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 12
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Department',
                        color: '#000000', // Solid black for X-axis title
                        font: {
                            family: 'Poppins',
                            size: 14,
                            weight: '600'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 12
                        }
                    }
                }
            }
        }
    });
}


    function updateCardData() {
        // Get values from the search form
        const department = document.getElementById('department').value.toLowerCase() || '';
        const startAge = parseInt(document.getElementById('start-age').value) || 15;
        const endAge = parseInt(document.getElementById('end-age').value) || 100;

        // Filter employees based on user input
        const filteredData = allEmployeeData.filter(employee => {
            const employeeDept = employee.department.toLowerCase();
            const employeeAge = new Date().getFullYear() - new Date(employee.date_of_birth).getFullYear();
            return (
                (department === '' || employeeDept.startsWith(department)) &&
                (employeeAge >= startAge && employeeAge <= endAge)
            );
        });

        // Calculate metrics
        const totalEmployees = filteredData.length;
        const allAges = filteredData.map(employee => new Date().getFullYear() - new Date(employee.date_of_birth).getFullYear());
        const totalAge = allAges.reduce((acc, age) => acc + age, 0);
        const averageAge = totalEmployees ? (totalAge / totalEmployees).toFixed(2) : 0;

        const maleEmployees = filteredData.filter(employee => employee.gender.toLowerCase() === 'male');
        const femaleEmployees = filteredData.filter(employee => employee.gender.toLowerCase() === 'female');

        // Update the card elements
        document.getElementById('totalEmployees').textContent = totalEmployees;
        document.getElementById('averageAgeAll').textContent = averageAge;
        document.getElementById('totalMaleEmployees').textContent = maleEmployees.length;
        document.getElementById('averageAgeMale').textContent = maleEmployees.length ? (maleEmployees.reduce((acc, emp) => acc + new Date().getFullYear() - new Date(emp.date_of_birth).getFullYear(), 0) / maleEmployees.length).toFixed(2) : 0;
        document.getElementById('totalFemaleEmployees').textContent = femaleEmployees.length;
        document.getElementById('averageAgeFemale').textContent = femaleEmployees.length ? (femaleEmployees.reduce((acc, emp) => acc + new Date().getFullYear() - new Date(emp.date_of_birth).getFullYear(), 0) / femaleEmployees.length).toFixed(2) : 0;

        updateGenderDistributionChart(filteredData);
        // createAgeGenderDisparityChart(filteredData);
    }

    function updateAdminCard() {
        const totalAdmins = allAdminData.length;
        document.getElementById('totalAdmins').textContent = totalAdmins;
    }

    
    
    function updateGenderDistributionChart(filteredData) {
        const totalEmployees = filteredData.length;
        const maleCount = filteredData.filter(employee => employee.gender.toLowerCase() === 'male').length;
        const femaleCount = filteredData.filter(employee => employee.gender.toLowerCase() === 'female').length;
    
        // Destroy previous chart instance if it exists
        if (window.genderDistributionChartInstance) {
            window.genderDistributionChartInstance.destroy();
        }
    
        const ctx = document.getElementById('genderDistributionChart').getContext('2d');
    
        // Create the pie chart
        window.genderDistributionChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Male', 'Female'],
                datasets: [{
                    data: [maleCount, femaleCount],
                    backgroundColor: ['#BC5449', '#710C04'], 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        color: '#fff',
                        formatter: function(value, context) {
                            const percentage = totalEmployees ? ((value / totalEmployees) * 100).toFixed(1) : 0;
                            return `${percentage}%`;  // Display percentage inside the pie
                        },
                        font: {
                            family: 'Poppins', // Use Poppins font
                            size: 30, // Make the percentages bigger
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const count = context.raw || 0;
                                const percentage = totalEmployees ? ((count / totalEmployees) * 100).toFixed(2) : 0;
                                return `${label}: ${count} (${percentage}%)`;
                            }
                        },
                        bodyFont: {
                            family: 'Poppins', // Use Poppins font for tooltips
                            size: 14,
                        },
                        titleFont: {
                            family: 'Poppins', 
                            size: 16,
                            weight: '600'
                        }
                    }
                }
            },
            plugins: [ChartDataLabels] // Add this to use the datalabels plugin
        });
    }
    
    
   
    
    document.getElementById('clearForm').addEventListener('click', function() {
        // Clear the department input
        document.getElementById('department').value = '';
    
        // Reset the age inputs to default values
        document.getElementById('start-age').value = '';
        document.getElementById('end-age').value = '';
        updateCardData();
    });

    // Add event listener to the filter button
    document.querySelector('.search-btn').addEventListener('click', function (event) {
        event.preventDefault();
        updateCardData();
    });

    // Fetch all employees and admins on page load
    fetchAllEmployees();
    fetchAllAdmins();
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
            document.querySelector('.adminName').textContent = adminData.last_name;
        })
        .catch(error => {
            console.error('Error fetching session data:', error);
        });


        // function updateEmailStatusChart() {
        //     fetch('/email-status')
        //         .then(response => response.json())
        //         .then(data => {
        //             const totalAttempts = data.total_attempts;
        //             const successfulEmails = data.successful_first_attempt + data.successful_retry;
        //             const failedEmails = data.failed_first_attempt + data.failed_retry;

        
        //             // Destroy the previous chart instance if it exists
        //             if (window.emailStatusChartInstance) {
        //                 window.emailStatusChartInstance.destroy();
        //             }
        
        //             const ctx = document.getElementById('emailStatusChart').getContext('2d');
        
        //             // Create the pie chart
        //             window.emailStatusChartInstance = new Chart(ctx, {
        //                 type: 'pie',
        //                 data: {
        //                     labels: ['Successful Emails', 'Failed Emails'],
        //                     datasets: [{
        //                         data: [successfulEmails, failedEmails],
        //                         backgroundColor: ['#BC5449','#710C04'], 
        //                     }]
        //                 },
        //                 options: {
        //                     responsive: true,
        //                     maintainAspectRatio: false,  // Set to false to ignore aspect ratio
        //                     plugins: {
        //                         datalabels: {
        //                             color: '#fff',
        //                             formatter: function(value, context) {
        //                                 const percentage = totalAttempts ? ((value / totalAttempts) * 100).toFixed(1) : 0;
                                        
        //                                 return `${percentage}%`;  // Display percentage inside the pie
        //                             },
        //                             font: {
        //                                 family: 'Poppins',
        //                                 size: 30,
        //                                 weight: 'bold'
        //                             }
        //                         },
        //                         tooltip: {
        //                             callbacks: {
        //                                 label: function (context) {
        //                                     const label = context.label || '';
        //                                     const count = context.raw || 0;
        //                                     const percentage = totalAttempts ? ((count / totalAttempts) * 100).toFixed(0) : 0;
        //                                     return `${label}: ${count} (${percentage}%)`;
        //                                 }
        //                             },
        //                             bodyFont: {
        //                                 family: 'Poppins',
        //                                 size: 14,
        //                             },
        //                             titleFont: {
        //                                 family: 'Poppins',
        //                                 size: 16,
        //                                 weight: '600'
        //                             }
        //                         }
        //                     }
        //                 },
        //                 plugins: [ChartDataLabels]
        //             });
        //         })
        //         .catch(error => {
        //             console.error('Error fetching email status data:', error);
        //         });
        // }
                

        function updateEmailStatusCards() {
            fetch('/email-status')
                .then(response => response.json())
                .then(data => {
                    const successfulEmails = Number(data.successful_first_attempt) + Number(data.successful_retry);
                    const failedEmails = Number(data.failed_first_attempt) + Number(data.failed_retry);
                    // Update the card elements with the counts
                    document.getElementById('successfulEmailsCount').textContent = successfulEmails;
                    document.getElementById('failedEmailsCount').textContent = failedEmails;          
                })
                .catch(error => {
                    console.error('Error fetching email status data:', error);
                });
        }
        
       
        updateEmailStatusCards();
        

        fetch('/getAdmins')
        .then(response => response.json())
        .then(data => {
            const pendingCount = data.length > 0 ? data[0].pendingCount : 0;
            const resetRequestCount = data.length > 0 ? data[0].resetRequestCount : 0;
    
            const totalNotifications = pendingCount + resetRequestCount; // Combine both counts
    
            const notificationCircle = document.querySelector('.notification-circle');
    
            if (totalNotifications > 0) {
                // Show the red circle with the total notifications count
                notificationCircle.style.display = 'inline-block';
                notificationCircle.textContent = totalNotifications;
            } else {
                // Hide the red circle if there are no pending notifications
                notificationCircle.style.display = 'none';
            }
        })
        .catch(error => console.error('Error fetching admin data:', error));
    
    

