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
const PORT = process.env.PORT || 3000;
const multer = require('multer');
const ExcelJS = require('exceljs');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
const XLSX = require('xlsx');






// Session setup

app.use(session({
    secret: 'Flax@123',
    resave: false,
    saveUninitialized: true
}));

// Body parser setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from 'Notifi' directory
app.use(express.static(path.join(__dirname, 'public'))); // Note: public folder is inside Notifi

// Middleware for authentication
app.use((req, res, next) => {
    const openRoutes = ['/index.html', '/login', '/waiting-for-approval.html', '/signup', '/terms']; // Open routes
    if (req.path === '/' || openRoutes.includes(req.path) || req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/images/')) {
        return next(); // Allow access to open routes and static files
    }
    isAuthenticated(req, res, next); // Check authentication for other routes
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html
});

app.get('/manage-admins.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'manage-admins.html')); // Serve manage-admins.html
});

app.get('/ad2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ad2.html')); // Serve ad2.html
});


app.get('/terms', (req, res) => {
    const termsPath = path.join(__dirname, 'terms.pdf');
    res.sendFile(termsPath);
});

app.get('/analytics.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'analytics.html')); // Serve analytics.html
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html')); // Serve dashboard.html
});

app.get('/settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html')); // Serve dashboard.html
});


app.get('/waiting-for-approval.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'waiting-for-approval.html')); // Serve waiting-for-approval.html
});
// Authentication middleware function
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next(); 
    } else {
        res.redirect('/');
    }
}



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


// Fetch all employees
app.get('/employees', (req, res) => {
    const sql = 'SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, "%Y-%m-%d") AS date_of_birth, email, phone_number, department FROM employees';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/employees', (req, res) => {
    const { pf_number, first_name, last_name } = req.query;

    let sql = 'SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, "%Y-%m-%d") AS date_of_birth, email, phone_number, department FROM employees WHERE 1=1';
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
    const sql = 'SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, "%Y-%m-%d") AS date_of_birth, email, phone_number, department FROM employees WHERE pf_number = ?';
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
    const { pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, department } = req.body;

    // SQL query to check if the PF number already exists
    const checkPfSql = 'SELECT COUNT(*) as count FROM employees WHERE pf_number = ?';

    db.query(checkPfSql, [pf_number], (err, result) => {
        if (err) {
            console.error('Error checking PF number:', err);
            return res.status(500).json({ message: 'Error checking PF number', error: err.message });
        }

        // If the PF number is not unique, return an error message
        if (result[0].count > 0) {
            return res.status(400).json({ message: 'PF number must be unique' });
        }

        // If PF number is unique, insert the new employee
        const insertSql = 'INSERT INTO employees (pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        
        db.query(insertSql, [pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, department], (err, result) => {
            if (err) {
                console.error('Error adding employee:', err);
                return res.status(500).json({ message: 'Error adding employee', error: err.message });
            }

            // If successful, return success message
            res.json({ message: 'Employee added successfully', id: result.insertId });
        });
    });
});



// Route to get filtered employees in analytics
app.get('/employees/filter', (req, res) => {
    const department = req.query.department ? req.query.department.toLowerCase() : '';
    const startAge = parseInt(req.query.startAge, 10) || 15;
    const endAge = parseInt(req.query.endAge, 10) || 100;

    const sql = `
        SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, "%Y-%m-%d") AS date_of_birth, email, phone_number, department
        FROM employees
        WHERE (LOWER(department) LIKE ?) 
        AND (YEAR(CURDATE()) - YEAR(date_of_birth) BETWEEN ? AND ?)
    `;

    db.query(sql, [`${department}%`, startAge, endAge], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});


app.put('/employees/:id', (req, res) => {
    const originalPfNumber = req.params.id;
    const { pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, department } = req.body;

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: 'Transaction error', error: err.message });
        }

        const updateEmployeeSql = `
            UPDATE employees 
            SET pf_number = ?, first_name = ?, last_name = ?, gender = ?, date_of_birth = ?, email = ?, phone_number = ?, department = ? 
            WHERE pf_number = ?`;

        db.query(updateEmployeeSql, [pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, department, originalPfNumber], (err, employeeResult) => {
            if (err) {
                console.error('Error updating employees:', err);
                return db.rollback(() => {
                    res.status(500).json({ message: 'Error updating employee', error: err.message });
                });
            }

            const checkAdminSql = `SELECT pf_number FROM admins WHERE pf_number = ?`;
            db.query(checkAdminSql, [originalPfNumber], (err, adminResult) => {
                if (err) {
                    console.error('Error checking admin status:', err);
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Error checking admin status', error: err.message });
                    });
                }

                if (adminResult.length > 0) {
                    const updateAdminSql = `UPDATE admins SET pf_number = ? WHERE pf_number = ?`;
                    db.query(updateAdminSql, [pf_number, originalPfNumber], (err, adminUpdateResult) => {
                        if (err) {
                            console.error('Error updating admin PF number:', err);
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Error updating admin PF number', error: err.message });
                            });
                        }

                        db.commit(err => {
                            if (err) {
                                console.error('Transaction commit error:', err);
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Transaction commit error', error: err.message });
                                });
                            }
                            res.json({ message: 'Updated successfully' });
                        });
                    });
                } else {
                    db.commit(err => {
                        if (err) {
                            console.error('Transaction commit error:', err);
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Transaction commit error', error: err.message });
                            });
                        }
                        res.json({ message: 'Updated successfully' });
                    });
                }
            });
        });
    });
});


// Check PF number uniqueness
// app.get('/employees/pf_number/:pfNumber', (req, res) => {
//     const pfNumber = req.params.pfNumber;
//     const sql = 'SELECT COUNT(*) AS count FROM employees WHERE pf_number = ?';
//     db.query(sql, [pfNumber], (err, result) => {
//         if (err) throw err;
//         const count = result[0].count;
//         if (count > 0) {
//             res.status(200).json({ message: 'PF number exists' });
//         } else {
//             res.status(404).json({ message: 'PF number does not exist' });
//         }
//     });
// });

// Delete an employee
app.delete('/employees/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM employees WHERE pf_number = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Employee deleted successfully' });
    });
});


// Route for deleting multiple employees
app.delete('/employees', (req, res) => {
    const pfNumbers = req.body.pf_numbers; // Array of PF numbers to delete

    if (pfNumbers && pfNumbers.length > 0) {
        const sql = `DELETE FROM employees WHERE pf_number IN (${pfNumbers.map(() => '?').join(',')})`;

        db.query(sql, pfNumbers, (err, result) => {
            if (err) {
                console.error('Error deleting employees:', err);
                res.status(500).json({ message: 'Error deleting employees', error: err.message });
            } else {
                res.json({ message: 'Employees deleted successfully' });
            }
        });
    } else {
        res.status(400).json({ message: 'No employees selected for deletion' });
    }
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
    const nextToTomorrow = new  Date(today);
    tomorrow.setDate(today.getDate() + 1);
    nextWeek.setDate(today.getDate() + 7);
    nextToTomorrow.setDate(today.getDate() + 2);
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);
    const nextToTomorrowStr = nextToTomorrow.toISOString().slice(0, 10);

    // Fetch today's birthdays
    getEmployeesWithBirthdaysInRange(todayStr, todayStr, (error, todaysBirthdays) => {
        if (error) {
            console.error("Error fetching today's birthdays:", error);
            return;
        }

        // Fetch tomorrow's birthdays
        getEmployeesWithBirthdaysInRange(tomorrowStr, tomorrowStr, (error, tomorrowsBirthdays) => {
            if (error) {
                console.error("Error fetching tomorrow's birthdays:", error);
                return;
            }

            // Fetch upcoming birthdays in the next week
            getEmployeesWithBirthdaysInRange(nextToTomorrowStr, nextWeekStr, (error, nextWeekBirthdays) => {
                if (error) {
                    console.error("Error fetching upcoming birthdays:", error);
                    return;
                }

                // Check if all birthday lists are empty
                if (todaysBirthdays.length === 0 && tomorrowsBirthdays.length === 0 && nextWeekBirthdays.length === 0) {
                    console.log("No birthdays to announce today, tomorrow, or in the upcoming week. No email will be sent.");
                    return; // No email will be sent
                }

                // If there are birthdays, proceed to construct the email
                const subject = 'Birthday Reminders';
                let text = 'Dear Team,\n\nHere are the birthday updates for our colleagues:\n\n';

                if (todaysBirthdays.length > 0) {
                    text += '🎂 *Today\'s Birthdays:*\n';
                    text += formatEmployeeList(todaysBirthdays);
                    text += '\n\n';
                }

                if (tomorrowsBirthdays.length > 0) {
                    text += '🎉 *Tomorrow\'s Birthdays:*\n';
                    text += formatEmployeeList(tomorrowsBirthdays);
                    text += '\n\n';
                }

                if (nextWeekBirthdays.length > 0) {
                    text += '🎈 *Upcoming Birthdays:*\n';
                    text += formatUpcomingBirthdays(nextWeekBirthdays);
                    text += '\n\n';
                }

                text += 'Let’s wish our colleagues a fantastic day ahead!\n\nBest regards,\nEquity Bank Rwanda PLC';

                // Fetch all employee emails
                db.query('SELECT email FROM employees', (err, results) => {
                    if (err) {
                        console.error('Error fetching employee emails:', err);
                        return;
                    }

                    const emailList = results.map(row => row.email);

                    const retryFailedEmails = (email, retries = 5, delay = 1 * 60 * 1000) => {
                        const mailOptions = {
                            from: 'musafiriflorice@gmail.com',
                            to: email,
                            subject: subject,
                            text: text
                        };

                        let attempts = 0;

                        const attemptToSend = () => {
                            transporter.sendMail(mailOptions, (error, info) => {
                                attempts++; // Increment the attempt count

                                if (error) {
                                    console.error(`Error sending email to ${email}: ${error.message}`);

                                    // Log each failure attempt
                                    logEmailStatus('Birthday Reminder', email, false, error.message, attempts, attempts > 1);

                                    if (attempts < retries) {
                                        console.log(`Retrying for ${email}... Attempt ${attempts} of ${retries}`);
                                        setTimeout(attemptToSend, delay);
                                    } else {
                                        console.log(`Failed to send email to ${email} after ${retries} attempts.`);
                                        // Log the final failure after max retries
                                        logEmailStatus('Birthday Reminder', email, false, `Failed after ${retries} attempts`, retries, true);
                                    }
                                } else {
                                    console.log(`Birthday email sent successfully to ${email}: ${info.response}`);
                                    // Log the success
                                    logEmailStatus('Birthday Reminder', email, true, null, attempts, attempts > 1);
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

        function sendMailWithRetry(mailOptions, emailType, retries = 5, delay = 1 * 60 * 1000) { // 1 minute delay between retries
            let attempts = 0;

            function attemptToSend() {
                attempts++; // Increment attempts at the start of each attempt
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error(`Error sending email to ${mailOptions.to}: ${error.message}`);
            
                        // Log the failure attempt with retry information
                        logEmailStatus(emailType, mailOptions.to, false, error.message, attempts, true); // Mark as retry attempt
            
                        // Retry for every error, but stop after the max number of retries
                        if (attempts < retries) {
                            console.log(`Retrying... Attempt ${attempts} of ${retries}`);
                            setTimeout(attemptToSend, delay); // Retry after delay
                        } else {
                            console.log(`Failed to send after ${retries} attempts.`);
                            logEmailStatus(emailType, mailOptions.to, false, `Failed after ${retries} attempts`, attempts);
                        }
                    } else {
                        console.log(`Email sent successfully to ${mailOptions.to}: ${info.response}`);
                        // Log the success
                        logEmailStatus(emailType, mailOptions.to, true, null, attempts, false); // Log as non-retry success
                    }
                });
            }

            attemptToSend(); // Start the first attempt
        }

        // Loop through today's birthdays and send the emails
        todaysBirthdays.forEach(emp => {
            const text = `Dear ${emp.first_name || 'Employee'} ${emp.last_name || ''},\n\nHappiest Birthday!\nWishing you a wonderful day filled with joy and success\n\nBest regards,\nEquity Bank Rwanda PLC`;
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
function logEmailStatus(emailType, email, isSuccess, reason = null, attemptNumber = 1, isRetry = false) {
    const query = `
        INSERT INTO email_logs (email_type, email_address, is_success, timestamp, reason, attempt_number, is_retry)
        VALUES (?, ?, ?, NOW(), ?, ?, ?)
    `;
    
    db.query(query, [emailType, email, isSuccess ? 1 : 0, reason, attemptNumber, isRetry ? 1 : 0], (err, result) => {
        if (err) {
            console.error(`Error logging email status for ${email}:`, err);
        } else {
            console.log(`Email status for ${email} logged successfully`);
        }
    });
}

// app.get('/email-retry-status', (req, res) => {
//     const query = `
//         SELECT
//             COALESCE(SUM(is_success AND is_retry), 0) AS successful_retries,
//             COALESCE(SUM((NOT is_success) AND is_retry), 0) AS failed_retries
//         FROM
//             email_logs
//         WHERE
//             is_retry = 1;
//     `;

//     db.query(query, (err, result) => {
//         if (err) {
//             console.error('Error fetching retry status data:', err);
//             res.status(500).send('Error fetching retry status data');
//         } else {
//             res.json(result[0]);
//         }
//     });
// });


// Schedule tasks
cron.schedule('00 08 * * *', sendGeneralBirthdayEmail, { timezone: "Africa/Kigali" });
cron.schedule('30 07 * * *', sendBirthdayWishes, { timezone: "Africa/Kigali" });

app.get('/email-status', (req, res) => {
    const query = `
        SELECT 
            COALESCE(SUM(CASE WHEN is_success = 1 AND is_retry = 0 THEN 1 ELSE 0 END), 0) AS successful_first_attempt,
            COALESCE(SUM(CASE WHEN is_success = 0 AND is_retry = 0 THEN 1 ELSE 0 END), 0) AS failed_first_attempt,
            COALESCE(SUM(CASE WHEN is_success = 1 AND is_retry = 1 THEN 1 ELSE 0 END), 0) AS successful_retry,
            COALESCE(SUM(CASE WHEN is_success = 0 AND is_retry = 1 THEN 1 ELSE 0 END), 0) AS failed_retry,
            COUNT(*) AS total_attempts
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
// app.post('/import', upload.single('file'), async (req, res) => {
//     const filePath = req.file.path;
//     const workbook = new ExcelJS.Workbook();

//     try {
//         await workbook.xlsx.readFile(filePath);
//         const worksheet = workbook.getWorksheet(1); // Assuming data is in the first sheet

//         let duplicateRecords = [];
//         let insertedRecords = 0;
//         let updatedRecords = 0;

//         // Read each row and process it
//         for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) { // Start from row 2 to skip headers
//             const row = worksheet.getRow(rowNumber);
//             const pfNumber = row.getCell(1).value;
//             const firstName = row.getCell(2).value;
//             const lastName = row.getCell(3).value;
//             const gender = row.getCell(4).value;
//             const dob = row.getCell(5).value;
//             const emailCell = row.getCell(6);
//             const email = emailCell.text || emailCell.value;
//             const phoneNumber = row.getCell(7).value;
//             const notificationMethod = row.getCell(8).value;
//             const department = row.getCell(9).value;

//             // Check if PF Number already exists
//             const query = 'SELECT * FROM employees WHERE pf_number = ?';
//             const [existingEmployee] = await db.promise().query(query, [pfNumber]);

//             if (existingEmployee.length > 0) {
//                 // PF Number exists, add to duplicates array
//                 duplicateRecords.push({ pfNumber, firstName, lastName });
//             } else {
//                 // Insert new employee data
//                 const insertQuery = `INSERT INTO employees 
//                     (pf_number, first_name, last_name, gender, date_of_birth, email, phone_number, department) 
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//                 await db.promise().query(insertQuery, [pfNumber, firstName, lastName, gender, dob, email, phoneNumber, notificationMethod, department]);
//                 insertedRecords++;
//             }
//         }

//         if (duplicateRecords.length > 0) {
//             res.json({
//                 message: 'Some records already exist. Do you want to update them?',
//                 duplicates: duplicateRecords
//             });
//         } else {
//             res.json({
//                 message: `Successfully imported ${insertedRecords} records.`
//             });
//         }
//     } catch (error) {
//         console.error('Error processing file:', error);
//         res.status(500).json({ message: 'Error processing file' });
//     } finally {
//         // Clean up the uploaded file
//         fs.unlinkSync(filePath);
//     }
// });

// // Endpoint to handle updating existing records
// app.post('/update', upload.single('file'), async (req, res) => {
//     const filePath = req.file.path;
//     const workbook = new ExcelJS.Workbook();

//     try {
//         await workbook.xlsx.readFile(filePath);
//         const worksheet = workbook.getWorksheet(1); // Assuming data is in the first sheet

//         let updatedRecords = 0;

//         // Read each row and update it
//         for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) { // Start from row 2 to skip headers
//             const row = worksheet.getRow(rowNumber);
//             const pfNumber = row.getCell(1).value;
//             const firstName = row.getCell(2).value;
//             const lastName = row.getCell(3).value;
//             const gender = row.getCell(4).value;
//             const dob = row.getCell(5).value;
//             const emailCell = row.getCell(6);
//             const email = emailCell.text || emailCell.value;
//             const phoneNumber = row.getCell(7).value;
//             const notificationMethod = row.getCell(8).value;
//             const department = row.getCell(9).value;

//             // Update existing employee data
//             const updateQuery = `UPDATE employees 
//                 SET first_name = ?, last_name = ?, gender = ?, date_of_birth = ?, email = ?, phone_number = ?, preferred_notification_method = ?, department = ? 
//                 WHERE pf_number = ?`;

//             await db.promise().query(updateQuery, [firstName, lastName, gender, dob, email, phoneNumber, notificationMethod, department, pfNumber]);
//             updatedRecords++;
//         }

//         res.json({
//             message: `Successfully updated ${updatedRecords} records.`
//         });
//     } catch (error) {
//         console.error('Error processing file:', error);
//         res.status(500).json({ message: 'Error processing file' });
//     } finally {
//         // Clean up the uploaded file
//         fs.unlinkSync(filePath);
//     }
// });


// // Handle the extract request
// app.post('/extract', (req, res) => {
//     const { startDate, endDate, gender } = req.body;

//     let query = `
//         SELECT pf_number, first_name, last_name, gender, DATE_FORMAT(date_of_birth, '%d %M') AS birthdate, email, phone_number, department
//         FROM employees
//         WHERE DATE_FORMAT(date_of_birth, '%m-%d') BETWEEN DATE_FORMAT(?, '%m-%d') AND DATE_FORMAT(?, '%m-%d')
//     `;

//     if (gender) {
//         query += ' AND gender = ?';
//     }

//     const queryParams = gender ? [startDate, endDate, gender] : [startDate, endDate];

//     db.query(query, queryParams, (err, results) => {
//         if (err) {
//             console.error('Error fetching employee data:', err);
//             return res.status(500).send('Error fetching employee data');
//         }

//         // Create a PDF document
//         const doc = new pdf();
//         let filename = 'Notifi_Birthday_Reports.pdf';

//         // Set headers to trigger a download
//         // Set headers to trigger a download with the correct filename
//         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//         res.setHeader('Content-Type', 'application/pdf');


//         // Pipe the PDF into the response
//         doc.pipe(res);

//         // Title
//         doc.fontSize(14).text('Notifi Birthday Reports', { align: 'center' });
//         doc.moveDown();


//         const columnWidths = {
//             pfNumber: 60,
//             firstName: 95,
//             lastName: 85,
//             gender: 42,
//             birthdate: 80,
//             email: 155,
//             phoneNumber: 90,
//             department: 80
//         };

//         // Adjust total table width to fit within page margins
//         const totalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
//         const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

//         // Scale down if necessary
//         if (totalWidth > pageWidth) {
//             const scaleFactor = pageWidth / totalWidth;
//             for (let key in columnWidths) {
//                 columnWidths[key] *= scaleFactor;
//             }
//         }

//         // Draw table headers
//         doc.fontSize(8).fillColor('black');
//         drawTableHeader(doc, columnWidths);

//         // Draw table rows
//         doc.fillColor('black');
//         results.forEach(employee => {
//             drawTableRow(doc, employee, columnWidths);
//         });

//         // Finalize the PDF and end the response
//         doc.end();
//     });
// });

// function drawTableHeader(doc, columnWidths) {
//     const x = doc.page.margins.left; // X position for the table
//     let y = doc.y;

//     // Draw the header text
//     doc.font('Helvetica-Bold')
//         .fontSize(8)
//         .text('PF', x, y, { width: columnWidths.pfNumber })
//         .text('First Name', x + columnWidths.pfNumber, y, { width: columnWidths.firstName })
//         .text('Last Name', x + columnWidths.pfNumber + columnWidths.firstName, y, { width: columnWidths.lastName })
//         .text('Gender', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName, y, { width: columnWidths.gender })
//         .text('Birthdate', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender, y, { width: columnWidths.birthdate })
//         .text('Email', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate, y, { width: columnWidths.email })
//         .text('Phone Number', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate + columnWidths.email, y, { width: columnWidths.phoneNumber })
//         .text('Department', x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate + columnWidths.email + columnWidths.phoneNumber, y, { width: columnWidths.department });

//     y += 12;

//     doc.strokeColor('black')
//         .lineWidth(1)
//         .moveTo(x, y)
//         .lineTo(x + Object.values(columnWidths).reduce((a, b) => a + b, 0), y)
//         .stroke();

//     y += 10; // Move down for the first row of content
//     doc.y = y;
// }

// // Function to draw a row of the table
// function drawTableRow(doc, employee, columnWidths) {
//     const x = doc.page.margins.left; // X position for the table
//     let y = doc.y;

//     doc.font('Helvetica')
//         .text(employee.pf_number, x, y, { width: columnWidths.pfNumber })
//         .text(employee.first_name, x + columnWidths.pfNumber, y, { width: columnWidths.firstName })
//         .text(employee.last_name, x + columnWidths.pfNumber + columnWidths.firstName, y, { width: columnWidths.lastName })
//         .text(employee.gender, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName, y, { width: columnWidths.gender })
//         .text(employee.birthdate, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender, y, { width: columnWidths.birthdate })
//         .text(employee.email, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate, y, { width: columnWidths.email })
//         .text(employee.phone_number, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate + columnWidths.email, y, { width: columnWidths.phoneNumber })
//         .text(employee.department, x + columnWidths.pfNumber + columnWidths.firstName + columnWidths.lastName + columnWidths.gender + columnWidths.birthdate + columnWidths.email + columnWidths.phoneNumber, y, { width: columnWidths.department });

//     y += 16; // Move down for the next row
//     doc.y = y;
// }




// Signup Route
// app.post('/signup', async (req, res) => {
//     const { pf_number, password, confirm_password } = req.body;

//     // Validate Passwords Match
//     if (password !== confirm_password) {
//         return res.send('Passwords do not match.');
//     }

//     // Check if PF Number Exists in Employees Table
//     db.query('SELECT * FROM employees WHERE pf_number = ?', [pf_number], (err, results) => {
//         if (err) throw err;

//         if (results.length === 0) {
//             return res.send('PF Number not found in employees table.');
//         } else {
//             // Check if PF Number Already Registered
//             db.query('SELECT * FROM admins WHERE pf_number = ?', [pf_number], async (err, results) => {
//                 if (err) throw err;

//                 if (results.length > 0) {
//                     return res.send('You are already created');
//                 } else {
//                     // Hash the Password
//                     const hashedPassword = await bcrypt.hash(password, 10);

//                     // Insert New User into Admins Table
//                     const newUser = { pf_number, password: hashedPassword, role: 3 }; // Default to third-level admin
//                     db.query('INSERT INTO admins SET ?', newUser, (err, results) => {
//                         if (err) throw err;
//                         res.send('Registration successful. Please wait for admission.');
//                     });
//                 }
//             });
//         }
//     });
// });



const saltRounds = 10;
const pfNumber = '43290';
const plainPassword = 'Flax@123';

// Check if the super admin already exists or if the table is empty
db.query('SELECT COUNT(*) AS count FROM admins', (err, countResult) => {
    if (err) {
        console.error('Error checking admin count:', err);
        return;
    }

    const adminCount = countResult[0].count;

    if (adminCount === 0) {
        // If the table is empty, reset the auto-increment value to 1
        db.query('ALTER TABLE admins AUTO_INCREMENT = 1', (err) => {
            if (err) {
                console.error('Error resetting auto-increment:', err);
                return;
            }

            // Now check if the super admin exists
            db.query('SELECT * FROM admins WHERE pf_number = ?', [pfNumber], (err, results) => {
                if (err) {
                    console.error('Error checking super admin:', err);
                    return;
                }

                if (results.length === 0) {
                    // Super admin does not exist, create them
                    bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                        if (err) {
                            console.error('Error hashing password:', err);
                            return;
                        }

                        // Insert the admin record
                        const query = 'INSERT INTO admins (pf_number, password, role, status, admitted_by) VALUES (?, ?, ?, ?, ?)';
                        const values = [pfNumber, hashedPassword, 1, 'active', null];

                        db.query(query, values, (err, insertResults) => {
                            if (err) {
                                console.error('Error inserting super admin:', err);
                                return;
                            }
                            console.log('Super admin created with ID:', insertResults.insertId);
                        });
                    });
                } else {
                    console.log('Super admin already exists');
                }
            });
        });
    } else {
        console.log('Admin table is not empty, no need to reset auto-increment.');
    }
});



app.post('/login', (req, res) => {
    const { pf_number, password } = req.body;

    if (!pf_number || !password) {
        return res.status(400).send('PF number and password are required');
    }

    // Query to get admin info, including first name, role, and status
    const query = `
        SELECT admins.id, admins.password, admins.role, admins.status, employees.first_name 
        FROM admins 
        JOIN employees ON admins.pf_number = employees.pf_number
        WHERE admins.pf_number = ?
    `;

    db.query(query, [pf_number], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid PF number or password');
        }

        const user = results[0];

        // Handle different statuses
        if (user.status === 'pending') {
            return res.redirect('/waiting-for-approval.html'); // Redirect to approval pending page
        } else if (user.status === 'inactive') {
            return res.redirect('/inactive.html'); // Redirect to inactive page
        }

        // If status is active, proceed to password validation
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Password comparison error:', err);
                return res.status(500).send('Error comparing passwords');
            }

            if (isMatch) {
                // Set session and include the first name
                req.session.user = {
                    id: user.id,
                    role: user.role,
                    first_name: user.first_name // Store the first name in the session
                };

                // Handle different roles after successful login
                if (user.role === 1 || user.role === 2) {
                    // Redirect to dashboard for role 1 (admin) and role 2 (second-level admin)
                    return res.redirect('/dashboard.html');
                } else if (user.role === 3) {
                    // Redirect to a different page for role 3 (third-level admin)
                    return res.redirect('/dashboard.html'); 
                }
            } else {
                return res.status(401).send('Invalid PF number or password');
            }
        });
    });
});



app.get('/session', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Not logged in');
    }

    const adminId = req.session.user.id;

    // Query to get all necessary information about the admin from both the employees and admins tables
    const query = `
        SELECT employees.first_name, employees.last_name, employees.pf_number, employees.email, employees.phone_number, employees.department, 
               admins.role, admins.status
        FROM employees
        JOIN admins ON employees.pf_number = admins.pf_number
        WHERE admins.id = ?
    `;

    db.query(query, [adminId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const adminData = results[0];

        // Send the necessary profile data
        res.json({
            first_name: adminData.first_name,
            last_name: adminData.last_name,
            pf_number: adminData.pf_number,
            email: adminData.email,
            phone_number: adminData.phone_number,
            department: adminData.department,
            role: adminData.role,
            status: adminData.status
        });
    });
});


app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).send('Logout error');
        }
        res.redirect('/'); 
    });
});




app.post('/signup', (req, res) => {
    const { pf_number, password } = req.body;

    // Check if all fields are provided
    if (!pf_number || !password) {
        return res.status(400).send('All fields are required.');
    }

    // Check if the PF number exists in the employees table
    db.query('SELECT * FROM employees WHERE pf_number = ?', [pf_number], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Server error.');
        }

        if (results.length === 0) {
            return res.status(404).send('PF number does not exist.');
        }

        // Hash the password before saving
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Password hashing error:', err);
                return res.status(500).send('Server error.');
            }

            // Insert the new admin record
            const role = 3;  // Default role for third-level admin
            const status = 'pending';  // Default status is pending
            const query = 'INSERT INTO admins (pf_number, password, role, status) VALUES (?, ?, ?, ?)';

            db.query(query, [pf_number, hashedPassword, role, status], (err, result) => {
                if (err) {
                    console.error('Error inserting admin:', err);
                    return res.status(500).send('Server error.');
                }

                // Redirect to a "waiting for approval" page
                res.redirect('/waiting-for-approval.html');
            });
        });
    });
});






app.get('/getAdmins', (req, res) => {
    const query = `
        SELECT 
            admins.id,
            admins.pf_number,
            employees.first_name,
            employees.last_name,
            employees.email,
            employees.phone_number,
            admins.role,
            admins.status
        FROM admins
        JOIN employees ON admins.pf_number = employees.pf_number
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching admin data:', err);
            return res.status(500).send('Error retrieving admin data');
        }
        res.json(results);
    });
});






// Function to convert Excel date serial number to JavaScript Date
// function excelDateToJSDate(serial) {
//     const epoch = new Date(1899, 11, 30); // Excel's epoch is December 30, 1899
//     const days = Math.floor(serial);
//     const milliseconds = Math.round((serial - days) * 86400000); // Convert fractional days to milliseconds
//     return new Date(epoch.getTime() + days * 86400000 + milliseconds);
// }


// Function to convert Excel date serial number to JavaScript Date
function excelDateToJSDate(serial) {
    const epoch = new Date(1899, 11, 30); // Excel's epoch is December 30, 1899
    const days = Math.floor(serial);
    const milliseconds = Math.round((serial - days) * 86400000); // Convert fractional days to milliseconds
    return new Date(epoch.getTime() + days * 86400000 + milliseconds - (new Date().getTimezoneOffset() * 60000));
}


// Define the route for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = path.join(__dirname, req.file.path);

        // Load the uploaded Excel file using xlsx
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Get the first sheet

        // Convert the worksheet to JSON format
        const data = XLSX.utils.sheet_to_json(worksheet, { raw: true });

        data.forEach(async (row) => {
            const {
                STAFF_ID: pfNumber,
                STAFF_NAME: staffName,
                DATE_OF_BIRTH: dateOfBirth,
                STAFF_GENDER: staffGender,
                TELEPHONE: phoneNumber,
                EMAIL_ID: emailId,
                DEPARTMENT_ID: department
            } = row;

            // Split the staffName to get first and last name
            const [firstName, ...lastNameParts] = staffName.split(' ');
            const lastName = lastNameParts.join(' ');

            // Convert dateOfBirth to proper format
            let formattedDateOfBirth;
            if (typeof dateOfBirth === 'number') {
                // Convert Excel serial date to JavaScript Date
                const jsDate = excelDateToJSDate(dateOfBirth);
                formattedDateOfBirth = jsDate.toISOString().split('T')[0];
            } else if (dateOfBirth instanceof Date) {
                // Directly format if it's already a Date object
                formattedDateOfBirth = dateOfBirth.toISOString().split('T')[0];
            } else {
                // If the date is in a string format, parse it directly
                formattedDateOfBirth = new Date(dateOfBirth).toISOString().split('T')[0];
            }

            const sql = `
                INSERT INTO employees (pf_number, first_name, last_name, date_of_birth, gender, phone_number, email, department)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    first_name = VALUES(first_name),
                    last_name = VALUES(last_name),
                    date_of_birth = VALUES(date_of_birth),
                    gender = VALUES(gender),
                    phone_number = VALUES(phone_number),
                    email = VALUES(email),
                    department = VALUES(department)
            `;

            const values = [
                pfNumber,
                firstName,
                lastName,
                formattedDateOfBirth,
                staffGender === 'M' ? 'Male' : 'Female',
                phoneNumber,
                emailId,
                department
            ];

            db.query(sql, values, (err) => {
                if (err) {
                    console.error('Error executing query:', err);
                }
            });
        });

        // Remove the uploaded file after processing
        fs.unlinkSync(filePath);

        res.status(200).json({ message: 'File uploaded and processed successfully' });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ message: 'An error occurred while processing the file' });
    }
});




app.post('/extract-data', async (req, res) => {
    const { 'report-start-date': startDate, 'report-end-date': endDate, 'report-department': department, gender } = req.body;

    // Default values for start and end date
    const defaultStartDate = '1900-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0]; // Today's date

    // Conditional assignment for startDate and endDate
    const start = startDate && startDate.trim() !== '' ? startDate : defaultStartDate;
    const end = endDate && endDate.trim() !== '' ? endDate : defaultEndDate;

    // Filters for department and gender
    const depFilter = department ? `${department}%` : '%'; // Case-insensitive matching
    const genderFilter = gender || '%'; // All genders if empty

    // Updated SQL query to include email and phone_number
    const query = `
        SELECT pf_number, CONCAT(first_name, ' ', last_name) AS staff_name, date_of_birth, gender AS staff_gender, department, email, phone_number
        FROM employees
        WHERE (date_of_birth BETWEEN ? AND ?)
        AND department LIKE ?
        AND gender LIKE ?
    `;

    db.query(query, [start, end, depFilter, genderFilter], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error generating report');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        // Adding headers for the Excel sheet, including email and phone number
        worksheet.columns = [
            { header: 'PF Number', key: 'pf_number', width: 15 },
            { header: 'Name', key: 'staff_name', width: 25 },
            { header: 'Birthdate', key: 'date_of_birth', width: 15 },
            { header: 'Gender', key: 'staff_gender', width: 10 },
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Email', key: 'email', width: 30 }, // New email column
            { header: 'Phone Number', key: 'phone_number', width: 15 } // New phone number column
        ];

        // Add rows to the worksheet based on the SQL result
        results.forEach(row => {
            worksheet.addRow({
                pf_number: row.pf_number,
                staff_name: row.staff_name,
                date_of_birth: row.date_of_birth,
                staff_gender: row.staff_gender,
                department: row.department,
                email: row.email, 
                phone_number: row.phone_number 
            });
        });

        const filePath = path.join(__dirname, 'uploads', 'Notifi Report.xlsx');
        await workbook.xlsx.writeFile(filePath);

        // Send the file as a download
        res.download(filePath, 'report.xlsx', (err) => {
            if (err) {
                console.error('Error sending the file:', err);
            }
            fs.unlinkSync(filePath); // Delete the file after download
        });
    });
});




// Approve an admin
app.post('/approveAdmin', (req, res) => {
    const adminId = req.body.adminId;

    const query = `
        UPDATE admins 
        SET status = 'active' 
        WHERE id = ?
    `;

    db.query(query, [adminId], (err, results) => {
        if (err) {
            console.error('Error updating admin status:', err);
            return res.status(500).send('Error updating admin status');
        }
        res.send('Admin approved');
    });
});

// Reject (delete) an admin
app.post('/rejectAdmin', (req, res) => {
    const adminId = req.body.adminId;

    const query = `
        DELETE FROM admins 
        WHERE id = ?
    `;

    db.query(query, [adminId], (err, results) => {
        if (err) {
            console.error('Error deleting admin:', err);
            return res.status(500).send('Error deleting admin');
        }
        res.send('Admin rejected');
    });
});



// app.post('/deactivateAdmin', (req, res) => {
//     const adminId = req.body.adminId;
//     const query = `
//         UPDATE admins 
//         SET status = 'inactive' 
//         WHERE id = ?
//     `;

//     db.query(query, [adminId], (err, results) => {
//         if (err) {
//             console.error('Error updating admin status:', err);
//             return res.status(500).send('Error deactivating admin');
//         }
//         res.send('Admin deactivated');
//     });
// });


// app.post('/activateAdmin', (req, res) => {
//     const adminId = req.body.adminId;

//     const query = `
//         UPDATE admins 
//         SET status = 'active' 
//         WHERE pf_number = ?
//     `;

//     db.query(query, [adminId], (err, results) => {
//         if (err) {
//             console.error('Error activating admin:', err);
//             return res.status(500).send('Error activating admin');
//         }
//         res.send('Admin activated successfully');
//     });
// });




app.post('/change-password', (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const adminId = req.session.user.id; 

    // Fetch the current password hash from the database
    db.query('SELECT password FROM admins WHERE id = ?', [adminId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Server error.');
        }

        if (results.length === 0) {
            return res.status(404).send('Admin not found.');
        }

        const hashedPassword = results[0].password;

        // Compare the old password with the hash
        bcrypt.compare(oldPassword, hashedPassword, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send('Server error.');
            }

            if (!isMatch) {
                return res.status(401).send('Old password is incorrect.');
            }

            // Hash the new password and update in the database
            bcrypt.hash(newPassword, saltRounds, (err, newHashedPassword) => {
                if (err) {
                    console.error('Password hashing error:', err);
                    return res.status(500).send('Server error.');
                }

                db.query('UPDATE admins SET password = ? WHERE id = ?', [newHashedPassword, adminId], (err) => {
                    if (err) {
                        console.error('Error updating password:', err);
                        return res.status(500).send('Server error.');
                    }

                    res.json({ message: 'Password changed successfully.' });
                });
            });
        });
    });
});



app.post('/updateAdminRole/:id', (req, res) => {
    const adminId = req.params.id;
    const { role } = req.body; // Get the new role from the request body

    // SQL query to update the admin role
    const query = `
        UPDATE admins 
        SET role = ? 
        WHERE id = ?
    `;

    db.query(query, [role, adminId], (err, results) => {
        if (err) {
            console.error('Error updating admin role:', err);
            return res.status(500).send('Error updating admin role');
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).send('Admin not found');
        }

        res.send('Admin role updated successfully');
    });
});






// Start server
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
