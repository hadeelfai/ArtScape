import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendContactMessage } from "../api/contact";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ContactUs() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await sendContactMessage(form);
      toast.success("Message sent successfully!");
      setForm((prev) => ({ ...prev, message: "" })); // clear only message if sent
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
        <h1 style={{ marginBottom: "20px", fontWeight: "bold", fontSize: "25px" }}>
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
          <input
            value={form.name}
            required
            readOnly // prevent editing
            style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
          />

          <input
            type="email"
            value={form.email}
            required
            readOnly
            style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
          />

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
              border: "1px solid #ccc",
            }}
          ></textarea>

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
