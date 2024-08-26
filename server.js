const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
// const fetch = require('node-fetch');


// Initialize express app
const app = express();
const port = 3000;

// Create connection to MySQL database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Musafiri7@7Florice',
    database: 'employeedb1'
});

// Connect to MySQL
db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Middleware
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.static(path.join('C:/Users/Florice/Desktop/Notifi'))); // Serving static files from Notifi folder

// Serve the HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join('C:/Users/Florice/Desktop/Notifi', 'admin-dashboard.html'));
});

// Fetch all employees
app.get('/employees', (req, res) => {
    const sql = 'SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, "%Y-%m-%d") AS date_of_birth, email, phone_number, preferred_notification_method, department FROM employees';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/employees', (req, res) => {
    const { pf_number, first_name, last_name } = req.query;

    let sql = 'SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, "%Y-%m-%d") AS date_of_birth, email, phone_number, preferred_notification_method, department FROM employees WHERE 1=1';
    const params = [];

    if (pf_number) {
        sql += ' AND pf_number LIKE ?';
        params.push(`${pf_number}%`);
    }
    if (first_name) {
        sql += ' AND LOWER(first_name) LIKE ?';
        params.push(`${first_name.toLowerCase()}%`);
    }
    if (last_name) {
        sql += ' AND LOWER(last_name) LIKE ?';
        params.push(`${last_name.toLowerCase()}%`);
    }

    db.query(sql, params, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});


// Fetch a single employee
app.get('/employees/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, "%Y-%m-%d") AS date_of_birth, email, phone_number, preferred_notification_method, department FROM employees WHERE pf_number = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    });
});

// Add a new employee
app.post('/employees', (req, res) => {
    const { pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, preferred_notification_method, department } = req.body;

    // Ensure the date_of_birth is in the correct format
    // Validate the data (e.g., ensure pf_number is unique if necessary)

    const sql = 'INSERT INTO employees (pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, preferred_notification_method, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, preferred_notification_method, department], (err, result) => {
        if (err) {
            // Handle specific error cases (e.g., duplicate entry)
            console.error('Error adding employee:', err);
            res.status(500).json({ message: 'Error adding employee', error: err.message });
        } else {
            res.json({ message: 'Employee added successfully', id: result.insertId });
        }
    });
});

// Update an employee
app.put('/employees/:id', (req, res) => {
    const originalId = req.params.id;
    const { pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, preferred_notification_method, department } = req.body;

    // Ensure the date_of_birth is in the correct format
    // Validate the data (e.g., ensure pf_number is unique if necessary)

    // Update query to allow changing the PF number, be cautious with primary keys
    const sql = 'UPDATE employees SET pf_number = ?, first_name = ?, last_name = ?, gender = ?, date_of_birth = ?, email = ?, phone_number = ?, preferred_notification_method = ?, department = ? WHERE pf_number = ?';

    db.query(sql, [pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, preferred_notification_method, department, originalId], (err, result) => {
        if (err) {
            // Handle specific error cases (e.g., no rows updated)
            console.error('Error updating employee:', err);
            res.status(500).json({ message: 'Error updating employee', error: err.message });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Employee not found' });
        } else {
            res.json({ message: 'Employee updated successfully' });
        }
    });
});

// Check PF number uniqueness
app.get('/employees/pf_number/:pfNumber', (req, res) => {
    const pfNumber = req.params.pfNumber;
    const sql = 'SELECT COUNT(*) AS count FROM employees WHERE pf_number = ?';
    db.query(sql, [pfNumber], (err, result) => {
        if (err) throw err;
        const count = result[0].count;
        if (count > 0) {
            res.status(200).json({ message: 'PF number exists' });
        } else {
            res.status(404).json({ message: 'PF number does not exist' });
        }
    });
});

// Delete an employee
app.delete('/employees/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM employees WHERE pf_number = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Employee deleted successfully' });
    });
});




// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'musafiriflorice@gmail.com',
        pass: 'qaku orgk uyhd dsai' // Your third-party app password
    }
});

// Function to send birthday wishes
function sendBirthdayWishes(employees) {
    employees.forEach(employee => {
        const mailOptions = {
            from: 'musafiriflorice@gmail.com',
            to: employee.email,
            subject: 'Happy Birthday!',
            text: `Dear ${employee.first_name} ${employee.last_name},\n\nHappy Birthday! Wishing you a wonderful day filled with joy and success.\n\nBest regards,\nEquity Bank Rwanda PLC`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(`Error sending email to ${employee.email}: ${error}`);
            } else {
                console.log(`Email sent to ${employee.email}: ${info.response}`);
            }
        });
    });
}

// Route to send birthday wishes
app.post('/send-birthday-wishes', (req, res) => {
    const query = `SELECT * FROM employees WHERE MONTH(date_of_birth) = MONTH(CURDATE()) AND DAY(date_of_birth) = DAY(CURDATE())`;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching today\'s birthdays:', error);
            res.status(500).json({ message: 'Error fetching today\'s birthdays' });
        } else {
            sendBirthdayWishes(results);
            res.json({ message: 'Birthday wishes sent successfully!' });
        }
    });
});


// Function to get employees with birthdays in a given date range
function getEmployeesWithBirthdaysInRange(startDate, endDate, callback) {
    const query = `
        SELECT first_name, last_name, email, DATE_FORMAT(date_of_birth, '%d %M') AS birthdate 
        FROM employees 
        WHERE DATE_FORMAT(date_of_birth, '%m-%d') BETWEEN DATE_FORMAT(?, '%m-%d') AND DATE_FORMAT(?, '%m-%d')
    `;
    db.query(query, [startDate, endDate], (error, results) => {
        if (error) {
            console.error('Error fetching birthdays:', error);
            return callback(error, null);
        }
        callback(null, results);
    });
}

cron.schedule('30 09 * * *', () => {
    console.log('Running automated tasks to send birthday wishes and reminders...');

    // Fetching and sending birthday wishes
    fetch('http://localhost:3000/send-birthday-wishes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Birthday wishes sent:', data.message);
        logEmailStatus('Birthday Wishes', true);
    })
    .catch(error => {
        console.error('Error sending birthday wishes:', error);
        logEmailStatus('Birthday Wishes', false);
    });

    // Fetching and sending birthday reminders
    fetch('http://localhost:3000/send-birthday-reminders', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Birthday reminders sent:', data.message);
        logEmailStatus('Birthday Reminders', true);
    })
    .catch(error => {
        console.error('Error sending birthday reminders:', error);
        logEmailStatus('Birthday Reminders', false);
    });
}, {
    scheduled: true,
    timezone: "Africa/Kigali" // Set to CAT (Central Africa Time)
});

function logEmailStatus(emailType, isSuccess) {
    const query = 'INSERT INTO email_logs (email_type, is_success, timestamp) VALUES (?, ?, NOW())';
    db.query(query, [emailType, isSuccess ? 1 : 0], (err, result) => {
        if (err) {
            console.error('Error logging email status:', err);
        } else {
            console.log('Email status logged successfully');
        }
    });
}


// Function to send reminder emails
function sendBirthdayReminders() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().slice(0, 10);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);

    // Get employees with birthdays today
    getEmployeesWithBirthdaysInRange(todayStr, todayStr, (error, todaysBirthdays) => {
        if (error) return;

        // Get employees with birthdays tomorrow
        getEmployeesWithBirthdaysInRange(tomorrowStr, tomorrowStr, (error, tomorrowsBirthdays) => {
            if (error) return;

            // Get employees with birthdays in the next 7 days
            getEmployeesWithBirthdaysInRange(todayStr, nextWeekStr, (error, nextWeekBirthdays) => {
                if (error) return;

                // Exclude today's birthdays from the upcoming week list
                const upcomingWithoutToday = nextWeekBirthdays.filter(emp => !todaysBirthdays.some(todayEmp => todayEmp.id === emp.id));

                // Send personalized emails to today's birthday employees
                todaysBirthdays.forEach(todayEmp => {
                    const mailOptions = {
                        from: 'musafiriflorice@gmail.com',
                        to: todayEmp.email,
                        subject: 'Birthday Reminder',
                        text: `
                            Happy Birthday, ${todayEmp.first_name} ${todayEmp.last_name}!

                            The following people also have birthdays today:
                            ${todaysBirthdays.filter(emp => emp.id !== todayEmp.id).map(emp => `\n${emp.first_name} ${emp.last_name} - ${emp.birthdate}`).join('')}

                            The following people have birthdays tomorrow:
                            ${tomorrowsBirthdays.map(emp => `\n${emp.first_name} ${emp.last_name} - ${emp.birthdate}`).join('')}

                            And here are the people with upcoming birthdays in the next 7 days:
                            ${upcomingWithoutToday.map(emp => `\n${emp.first_name} ${emp.last_name} - ${emp.birthdate}`).join('')}
                        `
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(`Error sending personalized reminder to ${todayEmp.email}: ${error}`);
                        } else {
                            console.log(`Personalized reminder sent to ${todayEmp.email}: ${info.response}`);
                        }
                    });
                });

                // Send a collective reminder to all other employees
                const recipientEmails = upcomingWithoutToday.map(emp => emp.email).concat(
                    tomorrowsBirthdays.map(emp => emp.email)
                ).filter(email => !todaysBirthdays.map(emp => emp.email).includes(email)).join(',');

                if (recipientEmails) {
                    const collectiveMailOptions = {
                        from: 'musafiriflorice@gmail.com',
                        to: recipientEmails,
                        subject: 'Birthday Reminders',
                        text: `
                            The following people have birthdays today:
                            ${todaysBirthdays.map(emp => `\n${emp.first_name} ${emp.last_name} - ${emp.birthdate}`).join('')}

                            The following people have birthdays tomorrow:
                            ${tomorrowsBirthdays.map(emp => `\n${emp.first_name} ${emp.last_name} - ${emp.birthdate}`).join('')}

                            And here are the people with upcoming birthdays in the next 7 days:
                            ${upcomingWithoutToday.map(emp => `\n${emp.first_name} ${emp.last_name} - ${emp.birthdate}`).join('')}
                        `
                    };

                    transporter.sendMail(collectiveMailOptions, (error, info) => {
                        if (error) {
                            console.log(`Error sending collective reminder emails: ${error}`);
                        } else {
                            console.log(`Collective reminder emails sent: ${info.response}`);
                        }
                    });
                }
            });
        });
    });
}


// POST route to trigger birthday reminders
app.post('/send-birthday-reminders', (req, res) => {
    sendBirthdayReminders();
    res.send({ message: 'Birthday reminders sent successfully!' });
});


// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});