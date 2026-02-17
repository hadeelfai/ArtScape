import { getApiBaseUrl } from '../config.js';

export async function sendContactMessage(formData) {
  const res = await fetch(`${getApiBaseUrl()}/contact`, {
    method: "POST",
    body: formData, //send FormData directly
  });

  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}
