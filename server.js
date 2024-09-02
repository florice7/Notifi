const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const pdf = require('pdfkit');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
// const fetch = require('node-fetch');
const app = express();
const port = 3000;
const multer = require('multer');
const ExcelJS = require('exceljs');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


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

cron.schedule('07 09 * * *', () => {
    console.log('Running automated tasks to send birthday reminders...');

    // Fetching and sending birthday reminders
    fetch('http://localhost:3000/send-birthday-reminders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log('Birthday reminders sent:', data.message);
            logEmailStatus('Birthday Reminders', true);
        })
        .catch(error => {
            console.error('Error sending birthday reminders:', error);
            logEmailStatus('Birthday Reminders', false, error.message);
        });
}, {
    scheduled: true,
    timezone: "Africa/Kigali" // Set to CAT (Central Africa Time)
});


function logEmailStatus(emailType, emailList, isSuccess, reason = null) {
    // Ensure emailList is an array
    const emails = Array.isArray(emailList) ? emailList : [emailList];

    // SQL query for logging a single email
    const query = 'INSERT INTO email_logs (email_type, email_address, is_success, timestamp, reason) VALUES (?, ?, ?, NOW(), ?)';

    // Loop through each email and log individually
    emails.forEach(email => {
        db.query(query, [emailType, email, isSuccess ? 1 : 0, reason], (err, result) => {
            if (err) {
                console.error(`Error logging email status for ${email}:`, err);
            } else {
                console.log(`Email status for ${email} logged successfully`);
            }
        });
    });
}



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
        if (error) {
            console.error("Error fetching today's birthdays:", error);
            return;
        }

        // Get employees with birthdays tomorrow
        getEmployeesWithBirthdaysInRange(tomorrowStr, tomorrowStr, (error, tomorrowsBirthdays) => {
            if (error) {
                console.error("Error fetching tomorrow's birthdays:", error);
                return;
            }

            // Get employees with birthdays in the next 7 days
            getEmployeesWithBirthdaysInRange(tomorrowStr, nextWeekStr, (error, nextWeekBirthdays) => {
                if (error) {
                    console.error("Error fetching upcoming week's birthdays:", error);
                    return;
                }

                console.log("Upcoming Without Today's Birthdays:", nextWeekBirthdays);

                // Handle today's birthday employees with personalized emails
                todaysBirthdays.forEach(todayEmp => {
                    const personalizedText = `
Dear ${todayEmp.first_name} ${todayEmp.last_name}, Happiest Birthday!
Wishing you a wonderful day filled with Joy and success.
Best regards,
Equity Bank Rwanda PLC

${todaysBirthdays.filter(emp => emp.id !== todayEmp.id).length > 0 ? `The following people also have birthdays today, wish them well:` : ``}
${todaysBirthdays.filter(emp => emp.id !== todayEmp.id).map(emp => `\n${emp.first_name} ${emp.last_name}`).join('')}

${tomorrowsBirthdays.length > 0 ? `The following people have birthdays tomorrow, wish them well:` : ``}
${tomorrowsBirthdays.map(emp => `\n${emp.first_name} ${emp.last_name}`).join('')}

${nextWeekBirthdays.length > 0 ? `Upcoming birthdays:` : ``}
${nextWeekBirthdays.map(emp => `\n${emp.first_name} ${emp.last_name}`).join('')}
`.trim();

                    const mailOptions = {
                        from: 'musafiriflorice@gmail.com',
                        to: todayEmp.email,
                        subject: 'Birthday Reminder',
                        text: personalizedText.trim()
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(`Error sending personalized reminder to ${todayEmp.email}: ${error}`);
                        } else {
                            console.log(`Personalized reminder sent to ${todayEmp.email}: ${info.response}`);
                        }

                        // Log the email status individually with reason if it fails
                        logEmailStatus('Birthday Reminder', [todayEmp.email], !error, error ? error.message : null);
                    });

                });

                // Handle collective reminder emails for everyone else
                const collectiveText = `
${todaysBirthdays.length > 0 ? `The following people have birthdays today, wish them well:` : ``}
${todaysBirthdays.map(emp => `\n${emp.first_name} ${emp.last_name}`).join('')}

${tomorrowsBirthdays.length > 0 ? `The following people have birthdays tomorrow, wish them well:` : ``}
${tomorrowsBirthdays.map(emp => `\n${emp.first_name} ${emp.last_name}`).join('')}

${nextWeekBirthdays.length > 0 ? `Upcoming birthdays:` : ``}
${nextWeekBirthdays.map(emp => `\n${emp.first_name} ${emp.last_name}`).join('')}
`.trim();

                const recipientEmails = nextWeekBirthdays
                    .map(emp => emp.email)
                    .concat(tomorrowsBirthdays.map(emp => emp.email))
                    .filter(email => !todaysBirthdays.map(emp => emp.email).includes(email));

                if (recipientEmails.length > 0) {
                    const collectiveMailOptions = {
                        from: 'musafiriflorice@gmail.com',
                        to: recipientEmails.join(','),
                        subject: 'Birthday Reminders',
                        text: collectiveText.trim()
                    };

                    transporter.sendMail(collectiveMailOptions, (error, info) => {
                        if (error) {
                            console.log(`Error sending collective reminder emails: ${error}`);
                        } else {
                            console.log(`Collective reminder emails sent: ${info.response}`);
                        }

                        // Log each email status individually with reason if it fails
                        recipientEmails.forEach(email =>
                            logEmailStatus('Birthday Reminder', [email], !error, error ? error.message : null)
                        );
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


// Endpoint to handle file upload and data import
app.post('/import', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1); // Assuming data is in the first sheet

        let duplicateRecords = [];
        let insertedRecords = 0;
        let updatedRecords = 0;

        // Read each row and process it
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) { // Start from row 2 to skip headers
            const row = worksheet.getRow(rowNumber);
            const pfNumber = row.getCell(1).value;
            const firstName = row.getCell(2).value;
            const lastName = row.getCell(3).value;
            const gender = row.getCell(4).value;
            const dob = row.getCell(5).value;
            const emailCell = row.getCell(6);
            const email = emailCell.text || emailCell.value;
            const phoneNumber = row.getCell(7).value;
            const notificationMethod = row.getCell(8).value;
            const department = row.getCell(9).value;

            // Check if PF Number already exists
            const query = 'SELECT * FROM employees WHERE pf_number = ?';
            const [existingEmployee] = await db.promise().query(query, [pfNumber]);

            if (existingEmployee.length > 0) {
                // PF Number exists, add to duplicates array
                duplicateRecords.push({ pfNumber, firstName, lastName });
            } else {
                // Insert new employee data
                const insertQuery = `INSERT INTO employees 
                    (pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, preferred_notification_method, department) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                await db.promise().query(insertQuery, [pfNumber, firstName, lastName, gender, dob, email, phoneNumber, notificationMethod, department]);
                insertedRecords++;
            }
        }

        if (duplicateRecords.length > 0) {
            res.json({
                message: 'Some records already exist. Do you want to update them?',
                duplicates: duplicateRecords
            });
        } else {
            res.json({
                message: `Successfully imported ${insertedRecords} records.`
            });
        }
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ message: 'Error processing file' });
    } finally {
        // Clean up the uploaded file
        fs.unlinkSync(filePath);
    }
});

// Endpoint to handle updating existing records
app.post('/update', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1); // Assuming data is in the first sheet

        let updatedRecords = 0;

        // Read each row and update it
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) { // Start from row 2 to skip headers
            const row = worksheet.getRow(rowNumber);
            const pfNumber = row.getCell(1).value;
            const firstName = row.getCell(2).value;
            const lastName = row.getCell(3).value;
            const gender = row.getCell(4).value;
            const dob = row.getCell(5).value;
            const emailCell = row.getCell(6);
            const email = emailCell.text || emailCell.value;
            const phoneNumber = row.getCell(7).value;
            const notificationMethod = row.getCell(8).value;
            const department = row.getCell(9).value;

            // Update existing employee data
            const updateQuery = `UPDATE employees 
                SET first_name = ?, last_name = ?, gender = ?, date_of_birth = ?, email = ?, phone_number = ?, preferred_notification_method = ?, department = ? 
                WHERE pf_number = ?`;

            await db.promise().query(updateQuery, [firstName, lastName, gender, dob, email, phoneNumber, notificationMethod, department, pfNumber]);
            updatedRecords++;
        }

        res.json({
            message: `Successfully updated ${updatedRecords} records.`
        });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ message: 'Error processing file' });
    } finally {
        // Clean up the uploaded file
        fs.unlinkSync(filePath);
    }
});


// Handle the extract request
app.post('/extract', (req, res) => {
    const { startDate, endDate, gender } = req.body;

    let query = `
        SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, '%d %M') AS birthdate, email, phone_number, department
        FROM employees
        WHERE DATE_FORMAT(date_of_birth, '%m-%d') BETWEEN DATE_FORMAT(?, '%m-%d') AND DATE_FORMAT(?, '%m-%d')
    `;

    if (gender) {
        query += ' AND gender = ?';
    }

    const queryParams = gender ? [startDate, endDate, gender] : [startDate, endDate];

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            return res.status(500).send('Error fetching employee data');
        }

        // Create a PDF document
        const doc = new pdf();
        let filename = 'Notifi_Birthday_Reports.pdf';

        // Set headers to trigger a download
        // Set headers to trigger a download with the correct filename
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');


        // Pipe the PDF into the response
        doc.pipe(res);

        // Title
        doc.fontSize(14).text('Notifi Birthday Reports', { align: 'center' });
        doc.moveDown();


        const columnWidths = {
            pfNumber: 60,
            firstName: 95,
            lastName: 85,
            gender: 42,
            birthdate: 80,
            email: 155,
            phoneNumber: 90,
            department: 80
        };

        // Adjust total table width to fit within page margins
        const totalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        // Scale down if necessary
        if (totalWidth > pageWidth) {
            const scaleFactor = pageWidth / totalWidth;
            for (let key in columnWidths) {
                columnWidths[key] *= scaleFactor;
            }
        }

        // Draw table headers
        doc.fontSize(8).fillColor('black');
        drawTableHeader(doc, columnWidths);

        // Draw table rows
        doc.fillColor('black');
        results.forEach(employee => {
            drawTableRow(doc, employee, columnWidths);
        });

        // Finalize the PDF and end the response
        doc.end();
    });
});

function drawTableHeader(doc, columnWidths) {
    const x = doc.page.margins.left; // X position for the table
    let y = doc.y;

    // Draw the header text
    doc.font('Helvetica-Bold')
        .fontSize(8)
        .text('PF', x, y, { width: columnWidths.pfNumber })
        .text('First Name', x + columnWidths.pfNumber, y, { width: columnWidths.firstName })
        .text('Last Name', x + columnWidths.pfNumber + columnWidths.firstName, y, { width: columnWidths.lastName })
        .text('Gender', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName, y, { width: columnWidths.gender })
        .text('Birthdate', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender, y, { width: columnWidths.birthdate })
        .text('Email', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate, y, { width: columnWidths.email })
        .text('Phone Number', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate + columnWidths.email, y, { width: columnWidths.phoneNumber })
        .text('Department', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate + columnWidths.email + columnWidths.phoneNumber, y, { width: columnWidths.department });

    y += 12;

    doc.strokeColor('black')
        .lineWidth(1)
        .moveTo(x, y)
        .lineTo(x + Object.values(columnWidths).reduce((a, b) => a + b, 0), y)
        .stroke();

    y += 10; // Move down for the first row of content
    doc.y = y;
}

// Function to draw a row of the table
function drawTableRow(doc, employee, columnWidths) {
    const x = doc.page.margins.left; // X position for the table
    let y = doc.y;

    doc.font('Helvetica')
        .text(employee.pf_number, x, y, { width: columnWidths.pfNumber })
        .text(employee.first_name, x + columnWidths.pfNumber, y, { width: columnWidths.firstName })
        .text(employee.last_name, x + columnWidths.pfNumber + columnWidths.firstName, y, { width: columnWidths.lastName })
        .text(employee.gender, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName, y, { width: columnWidths.gender })
        .text(employee.birthdate, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender, y, { width: columnWidths.birthdate })
        .text(employee.email, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate, y, { width: columnWidths.email })
        .text(employee.phone_number, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate + columnWidths.email, y, { width: columnWidths.phoneNumber })
        .text(employee.department, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate + columnWidths.email + columnWidths.phoneNumber, y, { width: columnWidths.department });

    y += 16; // Move down for the next row
    doc.y = y;
}




// Signup Route
app.post('/signup', async (req, res) => {
    const { pf_number, password, confirm_password } = req.body;

    // Validate Passwords Match
    if (password !== confirm_password) {
        return res.send('Passwords do not match.');
    }

    // Check if PF Number Exists in Employees Table
    db.query('SELECT * FROM employees WHERE pf_number = ?', [pf_number], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.send('PF Number not found in employees table.');
        } else {
            // Check if PF Number Already Registered
            db.query('SELECT * FROM users WHERE pf_number = ?', [pf_number], async (err, results) => {
                if (err) throw err;

                if (results.length > 0) {
                    return res.send('You are already created');
                } else {
                    // Hash the Password
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Insert New User into Users Table
                    const newUser = { pf_number, password: hashedPassword, role: 3 }; // Default to third-level admin
                    db.query('INSERT INTO users SET ?', newUser, (err, results) => {
                        if (err) throw err;
                        res.send('Registration successful. Please wait for admission.');
                    });
                }
            });
        }
    });
});




// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});