const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
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





const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'musafiriflorice@gmail.com',
        pass: 'qaku orgk uyhd dsai'
    }
});


// Function to get employees with birthdays in a given date range
function getEmployeesWithBirthdaysInRange(startDate, endDate, callback) {
    const query = `
        SELECT first_name, last_name, email, department, 
               DATE_FORMAT(date_of_birth, '%m-%d') AS birthdate
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

// Function to send a general email with birthday information
function sendGeneralBirthdayEmail() {
    const today = new Date();
    const tomorrow = new Date(today);
    const nextWeek = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().slice(0, 10);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);

    getEmployeesWithBirthdaysInRange(todayStr, todayStr, (error, todaysBirthdays) => {
        if (error) {
            console.error("Error fetching today's birthdays:", error);
            return;
        }

        getEmployeesWithBirthdaysInRange(tomorrowStr, tomorrowStr, (error, tomorrowsBirthdays) => {
            if (error) {
                console.error("Error fetching tomorrow's birthdays:", error);
                return;
            }

            getEmployeesWithBirthdaysInRange(todayStr, nextWeekStr, (error, nextWeekBirthdays) => {
                if (error) {
                    console.error("Error fetching upcoming birthdays:", error);
                    return;
                }

                const subject = 'Birthday Reminders';
                let text = 'Hello Team,\n Birthday Updates\n';

                if (todaysBirthdays.length > 0) {
                    text += 'Today\'s Birthdays:\n';
                    text += formatEmployeeList(todaysBirthdays);
                    text += '\n\n';
                }

                if (tomorrowsBirthdays.length > 0) {
                    text += 'Tomorrow\'s Birthdays:\n';
                    text += formatEmployeeList(tomorrowsBirthdays);
                    text += '\n\n';
                }

                if (nextWeekBirthdays.length > 0) {
                    text += 'Upcoming Birthdays:\n';
                    text += formatUpcomingBirthdays(nextWeekBirthdays);
                    text += '\n\n\n';
                }

                text += 'Best regards,\nEquity Bank Rwanda PLC';

                // Fetch all employee emails
                db.query('SELECT email FROM employees', (err, results) => {
                    if (err) {
                        console.error('Error fetching employee emails:', err);
                        return;
                    }
                
                    const emailList = results.map(row => row.email);
                
                    const retryFailedEmails = (email, retries = 5, delay = 1 * 60 * 1000) => { // 5 retries with 5 minutes delay
                        const mailOptions = {
                            from: 'musafiriflorice@gmail.com',
                            to: email,
                            subject: subject,
                            text: text
                        };
                
                        let attempts = 0; // Track number of attempts
                        
                        const attemptToSend = () => {
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    attempts++; // Increment the attempt count
                                    console.error(`Error sending email to ${email}: ${error.message}`);
                                    
                                    // Log the failure attempt with retry count
                                    logEmailStatus('Birthday Reminder', email, false, error.message, attempts);
                                    
                                    if (attempts < retries) { // Retry until attempts are exhausted
                                        console.log(`Retrying for ${email}... Attempt ${attempts} of ${retries}`);
                                        setTimeout(attemptToSend, delay); // Retry after delay
                                    } else {
                                        console.log(`Failed to send email to ${email} after ${retries} attempts.`);
                                        // Log the final failure after max retries
                                        logEmailStatus('Birthday Reminder', email, false, `Failed after ${retries} attempts`, retries);
                                    }
                                } else {
                                    console.log(`Birthday email sent successfully to ${email}: ${info.response}`);
                                    // Log the success
                                    logEmailStatus('Birthday Reminder', email, true);
                                }
                            });
                        };
                
                        attemptToSend(); // Start the first attempt
                    };
                
                    // Send emails and retry if needed
                    emailList.forEach(email => {
                        retryFailedEmails(email);
                    });
                });                
            });
        });
    });
}



// Function to send birthday wishes with retry logic
function sendBirthdayWishes() {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    getEmployeesWithBirthdaysInRange(todayStr, todayStr, (error, todaysBirthdays) => {
        if (error) {
            console.error("Error fetching today's birthdays:", error);
            return;
        }

        function sendMailWithRetry(mailOptions, emailType, retries = 5, delay = 1 * 60 * 1000) {  // 1 minute delay between retries
            let attempts = 0;

            function attemptToSend() {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error(`Error sending email to ${mailOptions.to}: ${error.message}`);
            
                        // Log the failure attempt
                        logEmailStatus(emailType, mailOptions.to, false, error.message, attempts); // Log retry attempt
            
                        // Retry for every error, but stop after the max number of retries
                        if (attempts < retries) {
                            attempts++; // Increment attempts before retrying
                            console.log(`Retrying... Attempt ${attempts} of ${retries}`);
                            setTimeout(attemptToSend, delay); // Retry after delay
                        } else {
                            console.log(`Failed to send after ${retries} attempts.`);
                            logEmailStatus(emailType, mailOptions.to, false, `Failed after ${retries} attempts`, retries);
                        }
                    } else {
                        console.log(`Email sent successfully to ${mailOptions.to}: ${info.response}`);
                        // Log the success
                        logEmailStatus(emailType, mailOptions.to, true);
                    }
                });
            }

            attemptToSend(); // Start the first attempt
        }

        // Loop through today's birthdays and send the emails
        todaysBirthdays.forEach(emp => {
            const text = `Dear ${emp.first_name || 'Employee'} ${emp.last_name || ''},\n\nHappiest Birthday!\nWishing you a wonderful day filled with joy\n\nBest regards,\nEquity Bank Rwanda PLC`;
            const mailOptions = {
                from: 'musafiriflorice@gmail.com',
                to: emp.email,
                subject: 'Happy Birthday!',
                text: text
            };

            sendMailWithRetry(mailOptions, 'Birthday Wishes', 5); // Retry up to 5 times
        });
    });
}



// Function to format employee list
function formatEmployeeList(employeeList) {
    return employeeList.map(emp => `- ${emp.first_name || 'Unknown'} ${emp.last_name || 'Unknown'} ${emp.email || 'Unknown'} (${emp.department || 'Unknown'})`).join('\n');
}

// Function to format upcoming birthdays
function formatUpcomingBirthdays(employeeList) {
    return employeeList.map(emp => `- ${emp.first_name || 'Unknown'} ${emp.last_name || 'Unknown'} (${emp.birthdate || 'Unknown'}) ${emp.email || 'Unknown'} (${emp.department || 'Unknown'})`).join('\n');
}

// Function to log email status
function logEmailStatus(emailType, emailList, isSuccess, reason = null, isRetry = 0) {
    if (!emailList || emailList.length === 0) {
        console.log(`No emails to log for ${emailType}. Skipping log.`);
        return; // Skip logging if no email was sent
    }

    const emails = Array.isArray(emailList) ? emailList : [emailList];
    const query = 'INSERT INTO email_logs (email_type, email_address, is_success, is_retry, timestamp, reason) VALUES (?, ?, ?, ?, NOW(), ?)';

    emails.forEach(email => {
        const status = isSuccess ? 1 : 0;

        db.query(query, [emailType, email, status, isRetry, reason], (err, result) => {
            if (err) {
                console.error(`Error logging email status for ${email}:`, err);
            } else {
                console.log(`Email status for ${email} logged successfully`);
            }
        });
    });
}



app.get('/email-retry-status', (req, res) => {
    const query = `
        SELECT
            COALESCE(SUM(is_success AND is_retry), 0) AS successful_retries,
            COALESCE(SUM((NOT is_success) AND is_retry), 0) AS failed_retries
        FROM
            email_logs
        WHERE
            is_retry = 1;
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching retry status data:', err);
            res.status(500).send('Error fetching retry status data');
        } else {
            res.json(result[0]);
        }
    });
});




// Schedule tasks
cron.schedule('10 16 * * *', sendGeneralBirthdayEmail, { timezone: "Africa/Kigali" });
cron.schedule('10 16 * * *', sendBirthdayWishes, { timezone: "Africa/Kigali" });

// Route to fetch email status
app.get('/email-status', (req, res) => {
    const query = `
        SELECT 
            COALESCE(SUM(is_success), 0) AS successful_emails,
            COALESCE(COUNT(*) - SUM(is_success), 0) AS failed_emails
        FROM 
            email_logs;
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching email status data:', err);
            res.status(500).send('Error fetching email status data');
        } else {
            res.json(result[0]);
        }
    });
});


// POST route to manually trigger birthday reminders
app.post('/send-birthday-reminders', (req, res) => {
    sendGeneralBirthdayEmail();
    res.send({ message: 'General birthday reminders sent successfully!' });
});

// POST route to manually trigger birthday wishes
app.post('/send-birthday-wishes', (req, res) => {
    sendBirthdayWishes();
    res.send({ message: 'Birthday wishes sent successfully!' });
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