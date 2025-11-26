
export async function sendContactMessage(data) {
  const res = await fetch("http://localhost:5500/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}