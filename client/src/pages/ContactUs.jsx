import React, { useState, useEffect,useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sendContactMessage } from "../api/contact";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ContactUs() {
  const navigate = useNavigate();

  // Form fields, now includes subject
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Simple validation errors for required fields
  const [errors, setErrors] = useState({
    subject: "",
    message: "",
  });

  const fileInputRef = useRef(null);

  // Optional file attachment (front-end only, just for status)
  const [attachment, setAttachment] = useState(null);
  const [attachmentStatus, setAttachmentStatus] = useState("");

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem("artscape:user");
    if (!userData) {
      navigate("/signin"); // Redirect user if not logged in
      return;
    }

    const user = JSON.parse(userData);
    setForm((prev) => ({
      ...prev,
      name: user.name || "",
      email: user.email || "",
    }));
  }, [navigate]);

  // Generic change handler
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error while typing
    if (name === "subject" || name === "message") {
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }
  }

  // File input change – only used to show upload status
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setAttachment(null);
      setAttachmentStatus("");
      return;
    }

    setAttachment(file);
    const sizeKB = Math.round(file.size / 1024);
    setAttachmentStatus(`Attached: ${file.name} (${sizeKB} KB)`);
  }

  // Validate individual field
  function validateField(field, value) {
    let error = "";

    if (!value.trim()) {
      error = "This field is required";
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  }

  // Validate whole form (for our flow we care about subject + message)
  function validateForm() {
    const subjectValid = validateField("subject", form.subject);
    const messageValid = validateField("message", form.message);
    return subjectValid && messageValid;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Exception flow: missing required fields
    if (!validateForm()) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      // We keep the same backend API and prepend the subject to the message
      const payload = {
        ...form,
        message: `Subject: ${form.subject}\n\n${form.message}`,
      };

      await sendContactMessage(payload);
      toast.success("Message sent successfully!");

      // Clear only subject + message + attachment, keep name/email from user
      setForm((prev) => ({
        ...prev,
        subject: "",
        message: "",
      }));
      setAttachment(null);
      setAttachmentStatus("");
      setErrors({ subject: "", message: "" });
      if (fileInputRef.current) {
  fileInputRef.current.value = "";
}

    } catch {
      toast.error("Failed to send message");
    }
  }

  return (
    <>
      <Navbar />
      <div
        style={{
          paddingTop: "100px",
          paddingBottom: "50px",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            marginBottom: "20px",
            fontWeight: "bold",
            fontSize: "25px",
          }}
        >
          Contact Us
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: "500px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {/* Name (read-only from user) */}
          <input
            value={form.name}
            required
            readOnly
            style={{
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: "#f9fafb",
            }}
          />

          {/* Email (read-only from user) */}
          <input
            type="email"
            value={form.email}
            required
            readOnly
            style={{
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: "#f9fafb",
            }}
          />

          {/* Subject / Title (required) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <input
              name="subject"
              placeholder="Subject / Title"
              value={form.subject}
              onChange={handleChange}
              style={{
                padding: "12px",
                borderRadius: "6px",
                border: `1px solid ${
                  errors.subject ? "#f97373" : "#ccc"
                }`,
              }}
            />
            {errors.subject && (
              <span
                style={{ fontSize: "12px", color: "#ef4444", marginLeft: "2px" }}
              >
                {errors.subject}
              </span>
            )}
          </div>

          {/* Message / Description (required) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <textarea
              name="message"
              placeholder="Your Message"
              value={form.message}
              onChange={handleChange}
              required
              style={{
                padding: "12px",
                minHeight: "120px",
                borderRadius: "6px",
                border: `1px solid ${
                  errors.message ? "#f97373" : "#ccc"
                }`,
              }}
            ></textarea>
            {errors.message && (
              <span
                style={{ fontSize: "12px", color: "#ef4444", marginLeft: "2px" }}
              >
                {errors.message}
              </span>
            )}
          </div>

          {/* Optional file attachment + status */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ fontSize: "14px" }}
            />
            {attachmentStatus && (
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                {attachmentStatus}
              </span>
            )}
          </div>

          <button
            type="submit"
            style={{
              padding: "12px",
              background: "black",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.background = "gray")}
            onMouseLeave={(e) => (e.target.style.background = "black")}
          >
            Send Message
          </button>
        </form>
      </div>

      <Footer />
    </>
  );
}

export default ContactUs;
