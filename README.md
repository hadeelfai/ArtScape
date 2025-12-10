🎨 ArtScape
A community-driven digital art platform where artists and collectors can share, discover, and transact artwork.
ArtScape brings together galleries, posts, comments, notifications, and marketplace features — powered by a modern React + Node.js + MongoDB stack.


📌 Table of Contents
Overview
Features
Project Goals
Tech Stack
API Overview
Authentication
Security
Testing & Linting
Project Structure


🚀 Overview
ArtScape is designed as both a social and commercial hub for digital art.
Users can:
Showcase and manage their artwork
Explore curated galleries and powerful search
Engage through posts, comments, likes, and follows
Buy and sell artworks through marketplace features
Receive real-time notifications


🎯 Project Goals
🧩 Simple onboarding (email/username registration)
🖼 Curated discovery via gallery browsing and search
🛒 Marketplace functionality for listings and purchases
🛡 Admin tools for moderation and content management
⚡ Smooth UX with fast, dynamic interactions


✨ Features
🔐 User Authentication — JWT + httpOnly cookies
🖼 Artwork Uploads — Cloudinary image hosting
📰 News & Articles — Admin-managed content
💬 Posts & Comments — Social features with RBAC
🔔 User Notifications
🛒 Marketplace — Listing, browsing, and transactions (depending on your implementation)
🔍 Global Search — Search artworks, posts, news, and more
🧠 Recommendation Support — Embedding-based similarity (Python script)


🛠 Tech Stack
Frontend
React
Vite
Tailwind CSS

Backend
Node.js
Express
MongoDB + Mongoose
Services & Tools
JWT Authentication (cookie + header)
Cloudinary (media uploads)
Nodemailer (emails)
Python embeddings (for recommendations)


📡 API Overview
All backend routes are located in server/routes/.

Auth Routes
Method	Endpoint	Description
POST	/users/register	Register a new user
POST	/users/login	Authenticate user + set cookie
POST	/users/logout	Clear auth cookie

Content & Core Routes
Route	Description
/posts	CRUD posts (write operations protected)
/comments	Create/read comments
/artworks	Artwork upload, gallery fetch, embeddings
/news	Articles & news (admin protected)
/notification	User notifications
/search	Unified search endpoint
/contact	Contact form submission


🔑 Authentication
Token stored in two ways:
httpOnly cookie (token)
Authorization header (Bearer <token>)
authMiddleware:
Validates JWT
Attaches req.user
Admin-only routes use dedicated RBAC middleware


🔐 Security
ArtScape follows modern web security practices:
🔒 Passwords hashed with bcrypt
🍪 Cookies set with httpOnly, secure=true in production
🛂 Role-based access control (admin middleware)
🛡 Input sanitization & validation on key forms
📦 Protected media uploads & user-generated content routes


🧪 Testing & Linting
Frontend Testing
Framework: Vitest
Config: client/vitest.config.js
Tests under: client/src/components/tests/
Linting
Suggested: ESLint + Prettier
(Configure based on your preferred setup.)


📂 Project Structure

ArtScape/
├── client/
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── public/
│   │   └── static assets...
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
