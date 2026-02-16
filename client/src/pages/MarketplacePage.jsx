import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "../components/SearchBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Filter, SlidersHorizontal, ShoppingCart } from "lucide-react";
import { useGalleryData } from "../hooks/useGalleryData";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500';


import {
  CATEGORY_TABS,
  matchesArtType,
  matchesCategory,
  matchesColor,
  matchesSize,
} from "../utils/artworkFilters";
import DropdownMenu from "../components/DropdownMenu";
import { useCart } from '../context/CartContext.jsx';
import { toast } from 'sonner';

const SIZE_FILTERS = [
  { value: "any", label: "All sizes" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const COLOR_FILTERS = [
  { value: "any", label: "Any color" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "pink", label: "Pink" },
];

const ART_TYPE_FILTERS = [
  { value: "any", label: "All mediums" },
  { value: "painting", label: "Painting" },
  { value: "photography", label: "Photography" },
  { value: "illustration", label: "Illustration" },
  { value: "drawing", label: "Drawing" },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "priceAsc", label: "Price low → high" },
  { value: "priceDesc", label: "Price high → low" },
];

const MarketplacePage = () => {
  const { user } = useAuth();
  const { users, artworks, loading } = useGalleryData();
  const { addToCart } = useCart();

  const [filters, setFilters] = useState({
    size: "any",
    color: "any",
    artType: "any",
  });

  const [category, setCategory] = useState("For You");
  const [sortOption, setSortOption] = useState("recommended");
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const [limit, setLimit] = useState(12);
  const sentinelRef = useRef(null);

  // Dropdown control
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const sortBtnRef = useRef(null);

  // Track Marketplace tab visit for recommendations
  useEffect(() => {
    if (!user?.token) return;
    fetch(`${API_BASE}/api/tracking/browse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify({ type: 'marketplace' })
    }).catch(() => {});
  }, [user?.token]);

  // Fetch recommendations from the recommendation service
  useEffect(() => {
    const token = user?.token;
    if (!token) {
      setRecommendations([]);
      return;
    }
    const fetchRecommendations = async () => {
      setRecommendationsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/recommendations/personalized?topK=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          // Handle the recommendation service response format
          if (data.recommendations && Array.isArray(data.recommendations)) {
            // Map recommendation format to artwork format
            const recommendedArtworks = data.recommendations.map(rec => ({
              _id: rec.artwork_id,
              id: rec.artwork_id,
              title: rec.title,
              artist: rec.artist_id,
              image: rec.image,
              price: rec.price,
              artworkType: 'Marketplace'
            }));
            setRecommendations(recommendedArtworks);
          }
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?.token]);

  // Filtering + Sorting
  const filteredArtworks = useMemo(() => {
    let artworksToSort = artworks
      .filter((art) => art.artworkType === "Marketplace")
      .filter((art) => matchesCategory(art, category))
      .filter((art) => matchesSize(art, filters.size))
      .filter((art) => matchesColor(art, filters.color))
      .filter((art) => matchesArtType(art, filters.artType));

    return artworksToSort.sort((a, b) => {
      if (sortOption === "recommended") {
        // If we have recommendations, prioritize them
        if (recommendations.length > 0) {
          const aIndex = recommendations.findIndex(
            (rec) => rec._id === a._id || rec.id === a._id
          );
          const bIndex = recommendations.findIndex(
            (rec) => rec._id === b._id || rec.id === b._id
          );
          
          // Items in recommendations come first
          if (aIndex !== -1 && bIndex === -1) return -1;
          if (aIndex === -1 && bIndex !== -1) return 1;
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        }
        // Fallback to most recent if no recommendations
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      }

      if (sortOption === "mostRecent") {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      }

      if (sortOption === "mostLiked") {
        const likesA = Array.isArray(a.likes) ? a.likes.length : (a.likes || 0);
        const likesB = Array.isArray(b.likes) ? b.likes.length : (b.likes || 0);
        return likesB - likesA;
      }

      const priceA = a.price || 0;
      const priceB = b.price || 0;

      if (sortOption === "priceAsc") return priceA - priceB;
      return priceB - priceA; // price high to low
    });
  }, [artworks, category, filters, sortOption, recommendations]);

  // Reset infinite scroll when filters change
  useEffect(() => {
    setLimit(12);
  }, [category, filters, sortOption, artworks.length]);

  // Infinite Scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && limit < filteredArtworks.length) {
          setLimit((prev) => prev + 8);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredArtworks.length, limit]);

  // Lookup user
  const lookupUser = (id) =>
    users.find((user) => user._id === id || user.id === id) || {};

  // Card Renderer
  const renderCard = (art) => {
    const user = lookupUser(art.artist);
    const username =
      user.username ||
      user.name?.replace(/\s+/g, "").toLowerCase() ||
      "artist";
    const avatarUrl = user.avatar || user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

    return (
      <Link to={`/artwork/${art._id || art.id}`} key={art._id || art.id} className="flex flex-col items-start gap-2 bg-white">
        <div className="aspect-[1/1] w-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            src={art.image && art.image.startsWith('http') ? art.image : '/Profileimages/User.jpg'}
            alt={art.title || 'Artwork'}
            className="w-full h-full object-cover"
            onError={e => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; }}
          />
        </div>
        <div className="text-left w-full">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={user._id ? `/profile/${user._id}` : '#'}
              onClick={e => e.stopPropagation()}
            >
              <img
                src={avatarUrl}
                alt={username}
                className="w-6 h-6 rounded-full object-cover border"
              />
            </Link>
            <Link
              to={user._id ? `/profile/${user._id}` : '#'}
              onClick={e => e.stopPropagation()}
              className="text-sm text-gray-500 hover:underline"
            >
              {username.startsWith('@') ? username : `@${username}`}
            </Link>
          </div>
          <div className="text-left w-full">
            <p className="font-semibold text-base text-gray-900">
              {art.title || "Untitled"}
            </p>
          </div>
          {art.price !== undefined && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-gray-900">{art.price} SAR</span>
              <button title="Add to cart" className="ml-1 p-1 hover:bg-gray-100 rounded" onClick={async e => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                const success = await addToCart(art, (error) => {
                  toast.error(error);
                });
                if (success) {
                  toast.success('Added to cart!');
                }
              }}>
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-36 pb-16">
        <SearchBar variant="bar" />

        {/* CATEGORY + FILTER + SORT */}
        <div className="px-6 md:px-12 lg:px-20 mt-6 space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-x-visible gap-3">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setCategory(tab)}
                className={`px-4 py-1.5 rounded-full font-medium border text-sm flex-shrink-0 md:flex-shrink ${category === tab
                  ? "bg-black text-white"
                  : "border-gray-300 text-gray-700 hover:border-black hover:text-black"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filter + Sort */}
          <div className="flex flex-wrap items-center gap-3 relative">
            {/* FILTER BUTTON */}
            <button
              ref={filterBtnRef}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 border border-gray-300 rounded-full px-4 py-2 bg-white hover:bg-gray-50"
              onClick={() => setIsFilterOpen((open) => !open)}
            >
              <Filter className="w-5 h-5" />
              Filter
            </button>

            {/* FILTER DROPDOWN */}
            <DropdownMenu
              open={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              triggerRef={filterBtnRef}
              className="left-0 mt-2 ml-10 shadow-xl min-w-[270px]"
            >
              <div className="font-bold text-lg px-6 py-3">Filters</div>
              <div className="border-t">
                {/* Size */}
                <div className="px-6 py-3 flex flex-col">
                  <span className="font-medium mb-1">Size</span>
                  <select
                    className="rounded-lg border px-3 py-2"
                    value={filters.size}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, size: e.target.value }))
                    }
                  >
                    {SIZE_FILTERS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Art Type */}
                <div className="px-6 py-3 flex flex-col">
                  <span className="font-medium mb-1">Art Type</span>
                  <select
                    className="rounded-lg border px-3 py-2"
                    value={filters.artType}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, artType: e.target.value }))
                    }
                  >
                    {ART_TYPE_FILTERS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div className="px-6 py-3 flex flex-col">
                  <span className="font-medium mb-1">Color</span>
                  <select
                    className="rounded-lg border px-3 py-2"
                    value={filters.color}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, color: e.target.value }))
                    }
                  >
                    {COLOR_FILTERS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </DropdownMenu>

            {/* SORT BUTTON */}
            <button
              ref={sortBtnRef}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 border border-gray-300 rounded-full px-4 py-2 bg-white hover:bg-gray-50"
              onClick={() => setIsSortOpen((open) => !open)}
            >
              <SlidersHorizontal className="w-5 h-5" />
              Sort
            </button>

            {/* SORT DROPDOWN */}
            <DropdownMenu
              open={isSortOpen}
              onClose={() => setIsSortOpen(false)}
              triggerRef={sortBtnRef}
              className="left-0 mt-2 shadow-xl max-w-[45px] px-0 py-0"
            >
              <div className="divide-y divide-gray-200 rounded-[2rem] overflow-hidden">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={`w-full py-4 px-6 text-base ${sortOption === option.value ? "font-bold bg-gray-100" : ""}`}
                    onClick={() => {
                      setSortOption(option.value);
                      setIsSortOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <div className="px-6 md:px-12 lg:px-20 mt-6">
          <h1 className="font-highcruiser text-3xl md:text-4xl lg:text-5xl">
            Marketplace
          </h1>
        </div>

        {/* ARTWORK GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-600">Loading Marketplace artworks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 px-6 md:px-12 lg:px-20 mt-8">
            {filteredArtworks.slice(0, limit).map(renderCard)}
          </div>
        )}

        <div ref={sentinelRef} className="h-2" />
      </div>
      <Footer />
    </div>
  );
};

export default MarketplacePage;
