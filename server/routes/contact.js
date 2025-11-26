import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

//contact form route
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD, 
      },
    });
    //message format
    const mailOptions = {
      from: `"${name}" <${process.env.ADMIN_EMAIL}>`,
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