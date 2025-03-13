document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const gender = document.getElementById("gender").value;
        const mobile = document.getElementById("mobile").value.trim();
        const dob = document.getElementById("dob").value;
        const email = document.getElementById("email").value.trim();
        const language = document.getElementById("language").value;
        const message = document.getElementById("message").value.trim();

        let errors = [];

        if (!firstName) errors.push("First name is required.");
        if (!lastName) errors.push("Last name is required.");
        if (!gender) errors.push("Gender is required.");
        if (!/^\+\d{1,3}\d{9}$/.test(mobile)) errors.push("Enter a valid mobile number starting with a country code.");
        if (!dob) errors.push("Date of birth is required.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Enter a valid email address.");
        if (!language) errors.push("Language is required.");
        if (!message) errors.push("Message cannot be empty.");

        if (errors.length > 0) {
            alert(errors.join("\n"));
        } else {
            try {
                // Submit the form data to the backend
                const response = await fetch("/submit-contact", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        gender,
                        mobile,
                        dob,
                        email,
                        language,
                        message,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    if (data.errors) {
                        alert(data.errors.map((error) => error.msg).join("\n"));
                    } else {
                        alert("An error occurred. Please try again.");
                    }
                } else {
                    alert("Thank you for contacting us! We received your message.");
                    form.reset(); // Clear the form fields
                }
            } catch (err) {
                console.error("Error submitting the form:", err);
                alert("An error occurred while submitting the form. Please try again later.");
            }
        }
    });
});
