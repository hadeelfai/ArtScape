document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const fetchSubmissionButton = document.getElementById("fetchSubmission");
    const detailsDiv = document.getElementById("submissionDetails");
    const detailsParagraph = document.getElementById("details");
    const clearDetailsButton = document.getElementById("clearDetails");

    //Retriving data from data base
    fetchSubmissionButton.addEventListener("click", async function () {
        const email = document.getElementById("emailDisplay").value.trim();
    
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            alert("Please provide a valid email address.");
            return;
        }
    
        try {
            const response = await fetch(`/get-submission?email=${encodeURIComponent(email)}`);
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    detailsDiv.style.display = "block";
                    detailsParagraph.innerHTML = `
                        <strong>Name:</strong> ${data.name}<br>
                        <strong>Artwork Title:</strong> ${data.artt}<br>
                        <strong>Art Category:</strong> ${data.artc}<br>
                        <strong>Description:</strong> ${data.descr}<br>
                        <strong>Price:</strong> ${data.price || "N/A"}<br>
                        <strong>Year:</strong> ${data.year}<br>
                        <strong>Availability:</strong> ${data.availability}<br>
                    `;
                    clearDetailsButton.style.display = "inline-block"; // Show the clear button after user info is fetched
                } else {
                    detailsDiv.style.display = "none";
                    alert("No submission found for the provided email.");
                }
            } else if (response.status === 404) {
                alert("No submission found for the provided email.");
            } else {
                throw new Error("Failed to fetch submission details.");
            }
        } catch (error) {
            alert("Error retrieving submission: " + error.message);
        }
    });

// Clear button to remove preivous info
    clearDetailsButton.addEventListener("click", function () {
        detailsDiv.style.display = "none";
        detailsParagraph.innerHTML = ""; 
        clearDetailsButton.style.display = "none"; 
        document.getElementById("emailDisplay").value = "";
    });
    


    form.addEventListener("submit", function (event) {
        let isValid = true;
        let messages = [];

        // Full Name validation
        const fullName = document.getElementById("full-name").value.trim();
        if (fullName === "") {
            isValid = false;
            messages.push("Full Name is required.");
        }

        // Email validation
        const email = document.getElementById("email").value.trim();
        if (email === "") {
            isValid = false;
            messages.push("Email Address is required.");
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            isValid = false;
            messages.push("Please provide a valid Email Address.");
        }

        // Phone validation (optional but if provided, ensure valid format)
        const phone = document.getElementById("phone").value.trim();
        if (phone !== "" && !/^\d{10,15}$/.test(phone)) {
            isValid = false;
            messages.push("Please provide a valid Phone Number.");
        }

        // Art Category validation
        const artCategory = document.getElementById("art-category").value;
        if (artCategory === "") {
            isValid = false;
            messages.push("Art Category is required.");
        }

        // Artwork Title validation
        const artTitle = document.getElementById("art-title").value.trim();
        if (artTitle === "") {
            isValid = false;
            messages.push("Artwork Title is required.");
        }

        // Creation Year validation
        const creationYear = document.getElementById("creation-year").value.trim();
        if (creationYear === "") {
            isValid = false;
            messages.push("Creation Year is required.");
        } else if (creationYear < 1900 || creationYear > 2100) {
            isValid = false;
            messages.push("Creation Year must be between 1900 and 2100.");
        }

        // Description validation
        const description = document.getElementById("description").value.trim();
        if (description === "") {
            isValid = false;
            messages.push("Description is required.");
        }

        // Artwork Image validation
        const artImage = document.getElementById("art-image").files[0];
        if (!artImage) {
            isValid = false;
            messages.push("Artwork Image is required.");
        } else if (!artImage.type.startsWith("image/")) {
            isValid = false;
            messages.push("Please upload a valid image file.");
        }

        // If form is invalid, prevent submission and display messages
        if (!isValid) {
            event.preventDefault();
            alert(messages.join("\n"));
        }
    });

    });
    

