const express = require("express");
const path = require("path");
const { check, validationResult } = require("express-validator");
const mysql = require("mysql2/promise");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static routing
app.use("/", express.static(path.resolve(__dirname, "../")));
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../html-folder/contactus.html"));
});

// MySQL pool configuration
const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "contact",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Form validation
function getFormValidation() {
    return [
        check("firstName").isLength({ min: 1, max: 200 }).withMessage("First name must be between 1 and 200 characters.")
            .isString().withMessage("First name must be a string").trim(),
        check("lastName").isLength({ min: 1, max: 200 }).withMessage("Last name must be between 1 and 200 characters.")
            .isString().withMessage("Last name must be a string").trim(),
        check("gender").isIn(["male", "female"]).withMessage("Gender must be one of 'male', 'female'."),
        check("mobile").isMobilePhone().withMessage("Mobile must be a valid phone number."),
        check("dob").isDate().withMessage("Date of birth must be a valid date."),
        check("email").isEmail().withMessage("Email must follow the format x@y.z").trim(),
        check("language").isLength({ min: 1, max: 200 }).withMessage("Language must be specified.").trim(),
        check("message").isLength({ max: 500 }).withMessage("Message must not exceed 500 characters.").trim(),
    ];
}

// Add user to database
async function addUser(firstName, lastName, gender, mobile, dob, email, language, message) {
    try {
        const sql = `INSERT INTO user (firstName, lastName, gender, mobile, dob, email, language, message)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [firstName, lastName, gender, mobile, dob, email, language, message];
        const [result] = await pool.query(sql, values);
        console.log("1 record has been added", result.insertId);
    } catch (err) {
        console.error("Error adding user:", err);
        throw err;
    }
}

// Handle form submissions
app.post("/submit-contact", getFormValidation(), async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ message: "Validation failed", errors: errors.array() });
    }
    const { firstName, lastName, gender, mobile, dob, email, language, message } = request.body;

    try {
        await addUser(firstName, lastName, gender, mobile, dob, email, language, message);
        response.status(201).send("Thank you for your submission");
    } catch (err) {
        response.status(500).send("An error occurred. Please try again later.");
    }
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
