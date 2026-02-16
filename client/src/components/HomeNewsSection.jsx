import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5500";

function HomeNewsSection() {
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/news/type/news`);
        
        if (!res.ok) {
          throw new Error("Failed to load news");
        }

        const newsData = await res.json();
        
        // Get the first news item
        if (newsData.length > 0) {
          setNewsItem(newsData[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  const handleCardClick = () => {
    if (!newsItem?._id) return;
    navigate(`/news/${newsItem._id}`, { state: { fromTab: "news" } });
  };

  if (loading || !newsItem) {
    return null;
  }

  return (
    <section className="py-16 px-6 md:px-20 max-w-[1120px] mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Latest News</h2>

      <article
        className="relative bg-white border border-gray-200 rounded-3xl overflow-hidden cursor-pointer transition hover:shadow-xl hover:-translate-y-1 w-full mx-auto"
        onClick={handleCardClick}
      >
        {/* Image Section */}
        <div className="relative w-full h-72 md:h-96 overflow-hidden">
          <img
            src={newsItem.image}
            alt={newsItem.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {newsItem.badge && (
            <div className="absolute top-6 left-6">
              <span className="inline-block px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs tracking-[0.12em] uppercase font-semibold text-gray-800 shadow-md">
                {newsItem.badge}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-3 text-[#050816] leading-tight">
            {newsItem.title}
          </h3>

          {newsItem.text && (
            <p className="text-base text-gray-600 mb-4 leading-relaxed">
              {newsItem.text.length > 150
                ? newsItem.text.slice(0, 150) + "..."
                : newsItem.text}
            </p>
          )}

          <div className="flex items-center justify-between">
            {newsItem.date && (
              <p className="text-sm text-gray-500">{newsItem.date}</p>
            )}
            
            {/* Read More Arrow */}
            <div className="flex items-center gap-2 text-sm font-medium text-[#050816]">
              <span>Read More</span>
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

export default HomeNewsSection;