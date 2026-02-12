import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE = "http://localhost:5500";

function News() {
  const [newsCards, setNewsCards] = useState([]);
  const [articleCards, setArticleCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.initialTab === "articles" ? "articles" : "news"
  );
  const navigate = useNavigate();

  

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [newsRes, articleRes] = await Promise.all([
          fetch(`${API_BASE}/news/type/news`),
          fetch(`${API_BASE}/news/type/article`),
        ]);

        if (!newsRes.ok || !articleRes.ok) {
          throw new Error("Failed to load news");
        }

        const newsData = await newsRes.json();
        const articleData = await articleRes.json();

        setNewsCards(newsData);
        setArticleCards(articleData);
      } catch (err) {
        console.error(err);
        setError("Error loading news and articles");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const isNews = activeTab === "news";

  // pick hero from DB
  const hero = isNews
    ? newsCards.find((item) => item.isHero)
    : articleCards.find((item) => item.isHero);

  const cards = isNews ? newsCards : articleCards;

const handleHeroClick = () => {
  if (!hero?._id) return;
  const fromTab = isNews ? "news" : "articles";

  if (isNews) {
    navigate(`/news/${hero._id}`, { state: { fromTab } });
  } else {
    navigate(`/articles/${hero._id}`, { state: { fromTab } });
  }
};

const handleCardClick = (id) => {
  const fromTab = isNews ? "news" : "articles";

  if (isNews) {
    navigate(`/news/${id}`, { state: { fromTab } });
  } else {
    navigate(`/articles/${id}`, { state: { fromTab } });
  }
};


return (
  <>
    <Navbar />

    {/* page background like other pages */}
    <div className="min-h-screen bg-white overflow-x-hidden">
      <main className="pt-28 pb-10 px-6 md:px-20 max-w-[1120px] mx-auto">
        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-gray-200 px-1 py-1 shadow-sm">
            <button
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                isNews
                  ? "bg-[#050816] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("news")}
            >
              News
            </button>

            <button
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                !isNews
                  ? "bg-[#050816] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("articles")}
            >
              Articles
            </button>
          </div>
        </div>

        {/* Hero — only shown if exists in DB */}
        {hero && (
          <section className="mb-8">
            {/* 👉 whole hero clickable */}
            <div
              className="relative h-80 rounded-[32px] overflow-hidden bg-cover bg-center cursor-pointer transition hover:scale-[1.01]"
              style={{ backgroundImage: `url(${hero.image})` }}
              onClick={handleHeroClick}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              <div className="absolute left-8 right-24 bottom-8 text-white">
                <span className="text-xs tracking-[0.12em] uppercase">
                  {hero.badge}
                </span>
                <h1 className="mt-2 text-2xl md:text-3xl font-bold">
                  {hero.title}
                </h1>
              </div>
              {/* arrow removed */}
            </div>
          </section>
        )}

        {/* Latest section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">
            {isNews ? "Latest News" : "Latest Articles"}
          </h2>

          {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}
          {loading && <p>Loading...</p>}

          <div className="flex flex-col gap-6">
            {cards.map((item) => (
              // 👉 whole card clickable
              <article
                key={item._id}
                className="relative flex bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer transition hover:shadow-md hover:-translate-y-[2px]"
                onClick={() => handleCardClick(item._id)}
              >
                <div className="w-40 md:w-56 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 p-4 pr-6">
                  {item.badge && (
                    <span className="block text-xs tracking-[0.12em] uppercase text-gray-500 mb-1">
                      {item.badge}
                    </span>
                  )}

                  <h3 className="text-lg font-semibold mb-1">
                    {item.title}
                  </h3>

                  {/* description from admin text box */}
                  {item.text && (
                    <p className="text-sm text-gray-600 mb-2">
                      {item.text.length > 120
                        ? item.text.slice(0, 120) + "..."
                        : item.text}
                    </p>
                  )}

                  {item.date && (
                    <p className="text-xs text-gray-500">{item.date}</p>
                  )}
                </div>

                {/* arrow button removed */}
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  </>
);

}

export default News;
