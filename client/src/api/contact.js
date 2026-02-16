export async function sendContactMessage(formData) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5500";
  const res = await fetch(`${API_URL}/contact`, {
    method: "POST",
    body: formData, //send FormData directly
  });

  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}
