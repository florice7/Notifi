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
                                
                            </tr>
                        `;
                    }
                })
                .join('');

        })
        .catch(error => console.error('Error fetching data:', error));
}


document.addEventListener('DOMContentLoaded', () => {
    // Populate the table with all employees by default
    populateTable('all');
});