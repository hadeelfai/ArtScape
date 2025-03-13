const express = require("express");
const path = require("path");
const { check, validationResult } = require("express-validator");
const multer = require("multer");
const mysql = require("mysql2/promise");
const fs = require("fs");

const app = express();

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static routing
app.use("/", express.static(path.resolve(__dirname, "../")));
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../html-folder/submission.html"));
});

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});
const upload = multer({ storage });

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

// Validation rules
function getFormValidation() {
    return [
        check("name").isLength({ min: 1, max: 100 })
            .withMessage("Name must be between 1-100 characters.")
            .isString()
            .withMessage("Name must be a string.")
            .trim(),
        check("phone").optional()
            .isMobilePhone()
            .withMessage("Phone number must be valid.")
            .trim(),
        check("email").isEmail()
            .withMessage("A valid email address is required.")
            .trim(),
        check("artt").isLength({ min: 1 })
            .withMessage("Art title is required.")
            .isString()
            .withMessage("Art title must be a string.")
            .trim(),
        check("year").optional()
            .isInt({ min: 1900, max: new Date().getFullYear() })
            .withMessage(`Year must be between 1900 and ${new Date().getFullYear()}.`)
            .trim(),
        check("artc").isLength({ min: 1 })
            .withMessage("Art category is required.")
            .trim(),
        check("desc").isLength({ min: 10, max: 250 })
            .withMessage("Description must be between 10-250 characters.")
            .trim(),
        check("availability").isIn(["for-sale", "display-only"])
            .withMessage("Availability must be 'For sale' or 'Display only'.")
            .trim(),
            check("price").optional({ nullable: true })
            .custom(value => {
                if (value === "") return true; 
                if (!isNaN(value)) return true; 
            })
            .withMessage("Price must be numeric.")
            .trim(),
        
    ];
}

// Add user to the database
async function addUser(data) {
    const sql = `
        INSERT INTO submissions (name, phone, email, artt, artc, descr, price, year, availability, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        data.name,
        data.phone,
        data.email,
        data.artt,
        data.artc,
        data.desc,
        data.price || null,
        data.year || null,
        data.availability,
        data.image || null,
    ];

    try {
        const [result] = await pool.query(sql, values);
        console.log("Record added with ID:", result.insertId);
    } catch (err) {
        console.error("Error inserting into database:", err);
        throw err;
    }
}

// Route for processing form submissions
app.post("/process", upload.single("art_image"), getFormValidation(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(`
            <h1>Sorry, we found validation errors with your submission</h1>
            <p>${errors.array().map(err => err.msg).join("<br>")}</p>
            <p><a href="../html-folder/submission.html">Return to the form</a></p>
        `);
    }

    const { name, phone, email, artt, artc, price, year, desc, availability } = req.body;
    const image = req.file ? req.file.filename : null;
    

    try {
        await addUser({ name, phone, email, artt, artc, price, year, desc, availability, image });
        res.status(201).send(`
            <h1>Thank You for Your Submission!</h1>
            <p>Your information has been successfully saved.</p>
            <p><a href="../html-folder/submission.html">Submit another response</a></p>
        `);
    } catch (err) {
        res.status(500).send(`
            <h1>An error occurred</h1>
            <p>Please try again later.</p>
        `);
    }
});


//Retriving data from database
app.get("/get-submission", async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    try {
        const sql = "SELECT name, artt, artc, descr, price, year, availability FROM submissions WHERE email = ?";
        const [rows] = await pool.query(sql, [email]);

        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json(null);
        }
    } catch (error) {
        console.error("Error retrieving submission:", error);
        res.status(500).json({ error: "An error occurred while retrieving the submission." });
    }
});


// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
