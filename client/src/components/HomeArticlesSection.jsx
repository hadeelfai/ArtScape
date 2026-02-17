import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getApiBaseUrl } from '../config.js';

function HomeArticlesSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadArticles() {
      try {
        setLoading(true);
        const res = await fetch(`${getApiBaseUrl()}/news/type/article`);
        
        if (!res.ok) {
          throw new Error("Failed to load articles");
        }

        const articleData = await res.json();
        
        // Get the first 2 articles
        setArticles(articleData.slice(0, 2));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadArticles();
  }, []);

  const handleCardClick = (id) => {
    if (!id) return;
    navigate(`/articles/${id}`, { state: { fromTab: "articles" } });
  };

  if (loading || articles.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-6 md:px-20 max-w-[1120px] mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Latest Articles</h2>

      {/* Stack of 2 Article Cards */}
      <div className="flex flex-col gap-6">
        {articles.map((article) => (
          <article
            key={article._id}
            className="relative flex bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer transition hover:shadow-md hover:-translate-y-[2px]"
            onClick={() => handleCardClick(article._id)}
          >
            <div className="w-32 md:w-40 h-32 md:h-40 flex-shrink-0">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 p-4">
              {article.badge && (
                <span className="block text-xs tracking-[0.12em] uppercase text-gray-500 mb-1">
                  {article.badge}
                </span>
              )}

              <h3 className="text-base md:text-lg font-semibold mb-1 line-clamp-2">
                {article.title}
              </h3>

              {article.text && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {article.text}
                </p>
              )}

              {article.date && (
                <p className="text-xs text-gray-500">{article.date}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomeArticlesSection;