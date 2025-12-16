import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5500";

function AdminProfile() {
  const { isAdmin, logout } = useAuth(); 
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); 
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const [activeSection, setActiveSection] = useState("content");

  // News and Articles from DB
  const [newsItems, setNewsItems] = useState([]); // type: "news"
  const [articles, setArticles] = useState([]); // type: "article"
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [formType, setFormType] = useState("news"); // "news" or "article"
  const [editingId, setEditingId] = useState(null); // _id when editing

  // Managing Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Managing artwork
  const [artworks, setArtworks] = useState([]);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const [artworksError, setArtworksError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    badge: "",
    text: "",
    content: "",
    date: "",
    image: "",
    isHero: false,
  });

  const fileInputRef = useRef(null);

  // Admin dashboard initial load
  useEffect(() => {
    if (!isAdmin) return;

    fetchNewsByType("news");
    fetchNewsByType("article");
    fetchAllArtworks();
    fetchUsers();
  }, [isAdmin]);

  async function fetchNewsByType(type) {
    try {
      setLoadingContent(true);
      setContentError("");

      const res = await fetch(`${API_BASE}/news/type/${type}`);
      if (!res.ok) throw new Error("Failed to load news");

      const data = await res.json();
      if (type === "news") setNewsItems(data);
      else setArticles(data);
    } catch (error) {
      console.error(error);
      setContentError("Error loading news and articles.");
    } finally {
      setLoadingContent(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleImageFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "post_mern");
    data.append("folder", "news");

    try {
      setImageUploading(true);

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dzedtbfld/image/upload",
        {
          method: "POST",
          body: data,
        }
      );

      const json = await res.json();
      const imageUrl = json.secure_url || json.url;

      if (!imageUrl) {
        const msg = json.error?.message || "Image upload failed";
        throw new Error(msg);
      }

      setFormData((prev) => ({
        ...prev,
        image: imageUrl,
      }));
    } catch (err) {
      console.error("Image upload error:", err);
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      title: formData.title,
      badge: formData.badge,
      text: formData.text, // short description
      content: formData.content, // full article
      date: formData.date,
      image: formData.image,
      type: formType,
      isHero: formData.isHero,
    };

    try {
      let res;
      if (editingId) {
        // Update existing item
        res = await fetch(`${API_BASE}/news/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        // Create new item
        res = await fetch(`${API_BASE}/news`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save news item");
      const saved = await res.json();

      // Update local list
      if (saved.type === "news") {
        if (editingId) {
          setNewsItems((prev) =>
            prev.map((item) => (item._id === saved._id ? saved : item))
          );
        } else {
          setNewsItems((prev) => [saved, ...prev]);
        }
      } else {
        if (editingId) {
          setArticles((prev) =>
            prev.map((item) => (item._id === saved._id ? saved : item))
          );
        } else {
          setArticles((prev) => [saved, ...prev]);
        }
      }

      // Reset form
      setFormData({
        title: "",
        badge: "",
        text: "",
        content: "",
        date: "",
        image: "",
        isHero: false,
      });
      setEditingId(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      alert("Error saving news item.");
    }
  }

  function handleEdit(item) {
    setFormType(item.type); // "news" or "article"
    setEditingId(item._id);
    setFormData({
      title: item.title || "",
      badge: item.badge || "",
      text: item.text || "",
      content: item.content || "",
      date: item.date || "",
      image: item.image || "",
      isHero: item.isHero || false,
    });
    setActiveSection("content");
  }

  async function handleDeleteNews(id, type) {
    const ok = window.confirm("Delete this item?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/news/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete");

      if (type === "news") {
        setNewsItems((prev) => prev.filter((item) => item._id !== id));
      } else {
        setArticles((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting news item.");
    }
  }

  async function fetchAllArtworks() {
    try {
      setArtworksLoading(true);
      setArtworksError("");

      const res = await fetch(`${API_BASE}/artworks`);
      if (!res.ok) throw new Error("Failed to fetch artworks");

      const data = await res.json();
      setArtworks(data);
    } catch (error) {
      console.error(error);
      setArtworksError("Error loading artworks.");
    } finally {
      setArtworksLoading(false);
    }
  }

  async function handleDeleteArtwork(id) {
    const ok = window.confirm("Delete this artwork?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/artworks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete artwork");

      setArtworks((prev) => prev.filter((art) => art._id !== id));
    } catch (error) {
      console.error(error);
      alert("Error deleting artwork.");
    }
  }

  async function fetchUsers() {
    try {
      setUsersLoading(true);
      setUsersError("");

      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setUsersError("Error loading users.");
    } finally {
      setUsersLoading(false);
    }
  }

  async function updateUserStatus(id, status) {
    const confirmMsg =
      status === "blocked"
        ? "Block this user? They will not be able to login."
        : status === "suspended"
        ? "Suspend this user?"
        : "Activate this user again?";

    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();

      // Update local list
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? data.user : u))
      );

      alert(data.message || "User status updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Error updating user status.");
    }
  }

  async function handleDeleteUser(id) {
    const ok = window.confirm(
      "Are you sure you want to permanently delete this user?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");

      setUsers((prev) => prev.filter((u) => u._id !== id));
      alert("User deleted successfully.");
    } catch (error) {
      console.error(error);
      alert("Error deleting user.");
    }
  }

  // If a non-admin somehow reaches this component
  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <p>You are not authorized to view this page.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Admin Profile</h1>

        {/* Tabs + Logout */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveSection("content")}
              className={
                activeSection === "content"
                  ? "px-4 py-2 rounded bg-black text-white"
                  : "px-4 py-2 rounded border"
              }
            >
              News & Articles
            </button>
            <button
              onClick={() => setActiveSection("artworks")}
              className={
                activeSection === "artworks"
                  ? "px-4 py-2 rounded bg-black text-white"
                  : "px-4 py-2 rounded border"
              }
            >
              User Artworks
            </button>
            <button
              onClick={() => setActiveSection("users")}
              className={
                activeSection === "users"
                  ? "px-4 py-2 rounded bg-black text-white"
                  : "px-4 py-2 rounded border"
              }
            >
              Users
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded border border-gray-300 text-sm hover:bg-black hover:text-white transition-colors"
          >
            Log Out
          </button>
        </div>

        {/* CONTENT SECTION */}
        {activeSection === "content" && (
          <section className="space-y-8">
            <h2 className="text-2xl font-semibold">Manage News & Articles</h2>
            {contentError && (
              <p className="text-sm text-red-600">{contentError}</p>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 border p-4 rounded"
            >
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="news"
                    checked={formType === "news"}
                    onChange={() => setFormType("news")}
                  />
                  News
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="article"
                    checked={formType === "article"}
                    onChange={() => setFormType("article")}
                  />
                  Article
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Badge / Category
                </label>
                <input
                  name="badge"
                  value={formData.badge}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="Event, Insight, Community..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Text</label>
                <textarea
                  name="text"
                  value={formData.text}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Article Content
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-2"
                  rows={8}
                  placeholder="Write the full article here. This appears only on the details page."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="OCT 21, 2025"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">
                  Image
                </label>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isHero"
                      checked={formData.isHero}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isHero: e.target.checked,
                        }))
                      }
                    />
                    Set as Hero
                  </label>
                </div>

                {/* Upload from device */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  ref={fileInputRef}
                />

                {imageUploading && <p>Uploading image...</p>}

                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    style={{
                      width: "200px",
                      marginTop: "10px",
                      borderRadius: "8px",
                    }}
                  />
                )}

                {/* Optional URL override */}
                <input
                  name="image"
                  value={formData.image}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="/NewsImages/news1.JPG or https://..."
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded bg-black text-white"
              >
                {editingId ? "Update" : "Create"}
              </button>
            </form>

            {/* Lists */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* News list */}
              <div>
                <h3 className="text-xl font-semibold mb-2">News</h3>
                {loadingContent && <p>Loading...</p>}
                {newsItems.length === 0 && !loadingContent && (
                  <p className="text-sm text-gray-500">
                    No news yet. Add from the form above.
                  </p>
                )}
                <ul className="space-y-2">
                  {newsItems.map((item) => (
                    <li
                      key={item._id}
                      className="border rounded p-3 flex justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs uppercase text-gray-500">
                          {item.badge}
                        </p>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.date}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteNews(item._id, "news")
                          }
                          className="text-xs border rounded px-2 py-1 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Articles list */}
              <div>
                <h3 className="text-xl font-semibold mb-2">Articles</h3>
                {articles.length === 0 && !loadingContent && (
                  <p className="text-sm text-gray-500">
                    No articles yet. Add from the form above.
                  </p>
                )}
                <ul className="space-y-2">
                  {articles.map((item) => (
                    <li
                      key={item._id}
                      className="border rounded p-3 flex justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs uppercase text-gray-500">
                          {item.badge}
                        </p>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.date}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteNews(item._id, "article")
                          }
                          className="text-xs border rounded px-2 py-1 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ARTWORKS SECTION */}
        {activeSection === "artworks" && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Manage User Artworks</h2>
            <button
              onClick={fetchAllArtworks}
              className="px-4 py-2 border rounded"
            >
              Refresh artworks
            </button>
            {artworksLoading && <p>Loading artworks...</p>}
            {artworksError && (
              <p className="text-sm text-red-600">{artworksError}</p>
            )}
            {artworks.length === 0 && !artworksLoading && (
              <p className="text-sm text-gray-500">
                No artworks found or not loaded yet.
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {artworks.map((art) => (
                <div
                  key={art._id}
                  className="border rounded p-3 flex gap-3 items-start"
                >
                  <div className="w-24 h-24 bg-gray-100 overflow-hidden">
                    {art.image && (
                      <img
                        src={art.image}
                        alt={art.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{art.title}</p>
                    {art.price && (
                      <p className="text-xs text-gray-500">
                        Price: {art.price} SAR
                      </p>
                    )}
                    <button
                      onClick={() => handleDeleteArtwork(art._id)}
                      className="mt-2 text-xs border rounded px-2 py-1 text-red-600"
                    >
                      Delete Artwork
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* USERS SECTION */}
        {activeSection === "users" && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Manage Users</h2>

            {usersError && (
              <p className="text-sm text-red-600">{usersError}</p>
            )}

            <button
              type="button"
              onClick={fetchUsers}
              className="px-3 py-1 border rounded text-sm mb-2"
            >
              Refresh users
            </button>

            {usersLoading && <p>Loading users...</p>}

            {!usersLoading && users.length === 0 && (
              <p className="text-sm text-gray-600">
                No users found or not loaded yet.
              </p>
            )}

            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Status:{" "}
                      <span className="font-semibold">
                        {user.accountStatus || "active"}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => updateUserStatus(user._id, "suspended")}
                      className="px-3 py-1 border rounded"
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => updateUserStatus(user._id, "blocked")}
                      className="px-3 py-1 border rounded"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => updateUserStatus(user._id, "active")}
                      className="px-3 py-1 border rounded"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="px-3 py-1 border rounded text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

export default AdminProfile;
