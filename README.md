🎨 ArtScape
A community-driven digital art platform where artists and collectors can share, discover, and transact artwork. ArtScape provides an end-to-end experience including galleries, posts, comments, notifications, and a marketplace — powered by a modern React/Node/MongoDB stack.

📌 Table of Contents
Overview
Features
Tech Stack
API Overview
Security
Testing & Linting
Project Structure



🚀 Overview
ArtScape is designed to be a social and commercial hub for digital art.
It enables users to:
Showcase their artwork
Engage through posts, comments, and social interaction
Explore curated galleries and search
Buy and sell artworks in a user-friendly marketplace
Receive real-time notifications


🎯 Project Goals
Provide a smooth onboarding experience (email/username registration)
Enable easy discovery through curated galleries and search
Offer simple marketplace tools for collectors and artists
Support moderation and admin management for safe community interaction


✨ Features
🔐 User Authentication (JWT + httpOnly cookies)
🖼 Artwork Uploads (Cloudinary integration)
📰 News & Articles (admin-managed)
💬 Posts & Comments with role-based permissions
🔔 Notifications
🛒 Marketplace (listing, browsing, transactions – depending on implementation)
🔍 Global Search (artworks, posts, news, etc.)


🛠 Tech Stack
Frontend
React
Vite
Tailwind CSS

Backend
Node.js + Express
MongoDB + Mongoose
Authentication via JWT (cookie + Authorization header)
Cloudinary for media storage
Nodemailer for email services


📡 API Overview
The server exposes REST endpoints under /server/routes.

Auth Routes
POST /users/register — Create account
POST /users/login — Authenticate & issue cookie
POST /users/logout — Remove auth cookie

Content Routes
/posts — CRUD posts (protected for write operations)
/comments — Add/read comments (protected write)
/artworks — Upload artworks, fetch galleries, generate embeddings
/news — News & articles (admin-only modifications)
/notification — User notifications
/search — Unified search across the platform
/contact — Contact form endpoint


🔑 Authentication Logic
Token accepted via Authorization: secure httpOnly cookie (token)
authMiddleware validates JWT and attaches req.user
Admin-only routes use dedicated RBAC middleware


🔐 Security
ArtScape follows modern security practices:
Passwords hashed with bcrypt
Auth token stored in httpOnly, secure cookies (production)
Role-based access control (RBAC) for admin routes
Validation/ sanitization for user input (registration, contact, content creation)


🧪 Testing & Linting
Frontend Testing
Uses Vitest
Config: client/vitest.config.js
Component tests located under: client/src/components/__tests__/
Linting should follow your chosen configuration (ESLint recommended).


📂 Project Structure

ArtScape/
├── client/
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── public/
│   │   ├── images, fonts, and static assets...
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
│   ├── package.json
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
