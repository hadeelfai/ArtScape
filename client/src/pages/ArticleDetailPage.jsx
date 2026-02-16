import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5500";

function ArticleDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // which tab the user came from: "news" or "articles"
  const fromTab =
    location.state?.fromTab === "articles" ? "articles" : "news";

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        setError("");

        // all content (news + articles) comes from /news/:id
        const endpoint = `${API_BASE}/news/${id}`;

        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error("Failed to load article");
        }

        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error(err);
        setError("Error loading this article.");
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white">
          <main className="pt-28 pb-10 px-6 md:px-20 max-w-[800px] mx-auto">
            <p>Loading...</p>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white">
          <main className="pt-28 pb-10 px-6 md:px-20 max-w-[800px] mx-auto">
            <p>{error || "Article not found."}</p>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-white">
        <main className="pt-28 pb-16 px-6 md:px-20 max-w-[800px] mx-auto">
          {/* back button */}
          <button
            onClick={() =>
              navigate("/news", { state: { initialTab: fromTab } })
            }
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300">
              ←
            </span>
            <span>Back</span>
          </button>

          {/* badge */}
          <div className="text-[11px] tracking-[0.16em] uppercase text-gray-600 mb-2">
            <span>
              {item.badge || (fromTab === "news" ? "NEWS" : "ARTICLE")}
            </span>
          </div>

          {/* title */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#050816] mb-1">
            {item.title}
          </h1>

          {/* date */}
          {item.date && (
            <p className="text-xs text-gray-500 mb-6">{item.date}</p>
          )}

          {item.image && (
            <div className="mb-8 flex justify-center">
              <div className="w-full max-w-[560px] md:max-w-[620px] aspect-[16/9] rounded-3xl overflow-hidden shadow-sm">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}


          {/* body text */}
          <div className="text-[16px] md:text-[17px] leading-[1.8] text-[#333] space-y-4">
            {(item.content || item.text || "")
              .split("\n")
              .map((para, index) => (
                <p key={index}>{para}</p>
              ))}
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}

export default ArticleDetailPage;
