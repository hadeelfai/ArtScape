import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE = "http://localhost:5500";

function AdminProfile() {
  const [activeSection, setActiveSection] = useState("content");

  // ------- NEWS + ARTICLES (from DB) -------
  const [newsItems, setNewsItems] = useState([]);      // type: "news"
  const [articles, setArticles] = useState([]);        // type: "article"
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [formType, setFormType] = useState("news");    // "news" or "article"
  const [editingId, setEditingId] = useState(null);    // _id when editing

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

  // ------- ARTWORKS (for delete) -------
  const [artworks, setArtworks] = useState([]);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const [artworksError, setArtworksError] = useState("");

  // Load news, articles, and artworks when admin page opens
  useEffect(() => {
    fetchNewsByType("news");
    fetchNewsByType("article");
    fetchAllArtworks();
  }, []);

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
      text: formData.text,        // short description
      content: formData.content,  // full article
      date: formData.date,
      image: formData.image,
      type: formType,
      isHero: formData.isHero,
    };

    try {
      let res;
      if (editingId) {
        // EDIT existing
        res = await fetch(`${API_BASE}/news/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE new
        res = await fetch(`${API_BASE}/news`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save news item");
      const saved = await res.json();

      // Update state list
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
    setFormType(item.type);      // "news" or "article"
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

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Profile</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
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
      </main>
      <Footer />
    </>
  );
}

export default AdminProfile;
