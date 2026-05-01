# ArtScape

A community-driven digital art platform where artists and collectors can **share, discover, and transact artwork**.  
ArtScape offers galleries, posts, comments, notifications, and a marketplace—powered by a modern **React + Node.js + MongoDB** stack.

---

## Table of Contents
- [Overview](#overview)
- [Project Goals](#project-goals)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Security](#security)
- [Testing & Linting](#testing--linting)
- [Project Structure](#project-structure)

---

## Overview

ArtScape is designed as both a **social** and **commercial** hub for digital art.  
Users can:

- Showcase and manage their artwork  
- Explore curated galleries and powerful search  
- Engage through posts, comments, likes, and follows  
- Buy and sell artworks through marketplace features  
- Receive real-time notifications  

---

## Project Goals

- Smooth onboarding (email/username registration)  
- Curated discovery through galleries and search  
- Marketplace tools for listings and purchases  
- Admin moderation tools for safe community interaction  
- Fast, modern UX using React + Vite  

---

## Features

- **User Authentication** — JWT + httpOnly cookies  
- **Artwork Uploads** — Cloudinary integration  
- **News & Articles** — Admin-managed content  
- **Posts & Comments** — Role-based permissions  
- **Real-time Notifications**  
- **Marketplace** — Listing, browsing, and transactions  
- **Global Search** — Search artworks, posts, news, etc.  
- **Recommendation System** — Embedding-based suggestions  

---

## Tech Stack

### **Frontend**
- React  
- Vite  
- Tailwind CSS  

### **Backend**
- Node.js + Express  
- MongoDB + Mongoose  

### **Other Tools**
- JWT Authentication (cookie + header)  
- Cloudinary (media uploads)  
- Nodemailer (email services)  
- Python embeddings (recommendation engine)  

---

## API Overview

All backend routes are in `server/routes/`.

### **Auth Routes**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/register` | Register new user |
| POST | `/users/login` | Login (set cookie) |
| POST | `/users/logout` | Clear auth cookie |

### **Content & Core Routes**
- `/posts` — CRUD posts (write protected)  
- `/comments` — Add/read comments  
- `/artworks` — Upload artworks, fetch galleries, generate embeddings  
- `/news` — News/articles (admin-only)  
- `/notification` — User notifications  
- `/search` — Unified search endpoint  
- `/contact` — Contact form  

---

## Authentication

- Token stored in:
  - **httpOnly cookie** (`token`)
  - OR `Authorization: Bearer <token>` header  
- `authMiddleware` validates JWT and attaches `req.user`  
- Admin-only routes use RBAC middleware  

---

## Security

- Passwords hashed with **bcrypt**  
- Cookies: `httpOnly` and `secure` in production  
- Role-based access control (RBAC) for admin routes  
- Input validation & sanitization  
- Protected upload endpoints  

---

## Testing & Linting

### **Frontend**
- Framework: **Vitest**  
- Config: `client/vitest.config.js`  
- Tests under: `client/src/components/tests/`  

### **Linting**
- ESLint + Prettier recommended  

---

## Project Structure

<pre>
ArtScape/
├── client/
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── public/
│   │   └── images, fonts, static assets...
│   ├── src/
│   │   ├── api/
│   │   │   ├── comments.js
│   │   │   ├── contact.js
│   │   │   └── posts.js
│   │   ├── components/
│   │   │   ├── CardsList.jsx
│   │   │   ├── CommentsSection.jsx
│   │   │   ├── DropdownMenu.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── HomeArticlesSection.jsx
│   │   │   ├── HomeNewsSection.jsx
│   │   │   ├── ImageUploader.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Post.jsx
│   │   │   ├── PostFeeds.jsx
│   │   │   ├── ReportModal.jsx
│   │   │   ├── ScrollVelocity.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── LikeSaveContext.jsx
│   │   ├── hooks/
│   │   │   └── useGalleryData.js
│   │   ├── pages/
│   │   │   ├── AboutUs.jsx
│   │   │   ├── AdminProfile.jsx
│   │   │   ├── ArticleDetailPage.jsx
│   │   │   ├── ArtworkDetailsPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── CommunityPage.jsx
│   │   │   ├── ContactUs.jsx
│   │   │   ├── EditProfilePage.jsx
│   │   │   ├── ExplorePage.jsx
│   │   │   ├── FollowerPage.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── GalleryPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── MarketplacePage.jsx
│   │   │   ├── News.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── OrdersPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── SignInPage.jsx
│   │   │   └── SignUpPage.jsx
│   │   ├── utils/
│   │   │   ├── artworkFilters.js
│   │   │   └── tagDefinitions.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── vitest.config.js
│
├── server/
│   ├── .env
│   ├── server.js
│   ├── controllers/
│   │   └── artworkController.js
│   ├── middleware/
│   │   └── AuthMiddleware.js
│   ├── models/
│   │   ├── Artwork.js
│   │   ├── Comments.js
│   │   ├── News.js
│   │   ├── Notification.js
│   │   ├── Posts.js
│   │   ├── Report.js
│   │   └── User.js
│   ├── routes/
│   │   ├── Artworks.js
│   │   ├── Comments.js
│   │   ├── contact.js
│   │   ├── News.js
│   │   ├── Notification.js
│   │   ├── Posts.js
│   │   ├── search.js
│   │   └── Users.js
│   ├── utils/
│   │   ├── cloudinary.js
│   │   ├── embedQueue.js
│   │   └── recommend.js
│   └── python/
│       └── compute_embeddings.py
│
├── package.json
├── package-lock.json
└── README.md
</pre>
