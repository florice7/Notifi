const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');

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
    const sql = 'SELECT pf_number, first_name, last_name, gender, DATE(date_of_birth) as date_of_birth, email, phone_number, preferred_notification_method, department FROM employees';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Fetch a single employee
app.get('/employees/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT pf_number, first_name, last_name, gender, DATE(date_of_birth) as date_of_birth, email, phone_number, preferred_notification_method, department FROM employees WHERE pf_number = ?';
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

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
