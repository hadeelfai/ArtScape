# ArtScape Railway Deployment Guide

## Fix for "Failed to parse as JSON" / Client loads but no data

This error occurs when the client receives **HTML instead of JSON** from API calls (status 200 but body is your SPA's `index.html`). That happens when:

1. **VITE_API_URL is wrong or missing** – the client fetches the wrong URL (e.g. its own URL) and gets HTML.
2. **CORS** – the server blocks cross-origin requests from the client.

---

## 1. Set Environment Variables

### Client service (Railway)

Set this **before building** so it gets baked into the bundle:

| Variable       | Value                              | Required |
|----------------|------------------------------------|----------|
| `VITE_API_URL` | Your **backend** Railway URL       | Yes      |

Example: `VITE_API_URL=https://artscape-server-production.up.railway.app`

Vite injects `VITE_*` vars at **build time**. Redeploy the client after changing this.

### Server service (Railway)

| Variable       | Value                              | Required |
|----------------|------------------------------------|----------|
| `FRONTEND_URL` | Your **client** Railway URL        | Yes      |
| `MONGO_URL`    | MongoDB connection string          | Yes      |
| `JWT_SECRET`   | Secret for JWT signing             | Yes      |
| ...            | Other server env vars              | -        |

Example: `FRONTEND_URL=https://artscape-client-production.up.railway.app`

---

## 2. Deployment layout

You should have **two** Railway services (or two deploys):

- **Client**: build + run `npm run preview` (or serve static files)
- **Server**: run `node server.js` (or equivalent)

Client and server must have different public URLs.

---

## 3. Verify

1. Open DevTools → Network.
2. Find requests to `/users` and `/artworks`.
3. Confirm the **Request URL** is your backend URL, e.g. `https://your-server.railway.app/users`.
4. Response **Content-Type** should be `application/json`, not `text/html`.

---

## 4. Quick checklist

- [ ] `VITE_API_URL` set to backend URL in the **client** service
- [ ] Client rebuilt/redeployed after setting `VITE_API_URL`
- [ ] `FRONTEND_URL` set to client URL in the **server** service
- [ ] Server and MongoDB are running and reachable
