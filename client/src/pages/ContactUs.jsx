import React, { useState } from "react";
import { sendContactMessage } from "../api/contact";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await sendContactMessage(form);
      toast.success("Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error("Failed to send message");
    }
  }

  return (
    <>
      <Navbar />

      {/* TO FIX NAVBAR OVERLAP + CENTER CONTENT */}
      <div
        style={{
          paddingTop: "100px",   // keeps content below Navbar
          paddingBottom: "50px",
          minHeight: "80vh",     // pushes Footer to bottom
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1 style={{ marginBottom: "20px" , fontWeight: "bold" , fontSize: '25px'}}>Contact Us</h1>

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
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
          />

          <input
            name="email"
            placeholder="Your Email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
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
            onMouseEnter={(e) => (e.target.style.background = "gray")}//for page button hover
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
