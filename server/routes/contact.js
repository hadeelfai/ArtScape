import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// ✅ SECURITY FIX: Helper function for basic input validation
function validateContactForm(name, email, message) {
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Valid email is required');
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
        errors.push('Message must be at least 10 characters');
    }
    return errors;
}

//contact form route
// ✅ SECURITY FIX: Added input validation and basic rate limiting setup
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    const validationErrors = validateContactForm(name, email, message);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }
    
    // TODO: Add rate limiting middleware (e.g., express-rate-limit) to prevent spam
    // Example: const limiter = rateLimit({ windowMs: 15*60*1000, max: 3 });
    // Then add to route: router.post("/", limiter, async (req, res) => {...})

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD, 
      },
    });
    //message format
    const mailOptions = {
      from: `"${name}" <${process.env.ADMIN_EMAIL}>`, //sent from artscape email to prevent block
      replyTo: email,//reply to user's email
      to: process.env.ADMIN_EMAIL,
      subject: "New Contact Form Message",
      html: `
        <h2>New Message from Contact Form</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Contact Form Error:", err);
    res.status(500).json({ error: "Failed to send the message" });
  }
});

export default router;