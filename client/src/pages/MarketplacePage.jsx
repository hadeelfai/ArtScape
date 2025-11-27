import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "../components/SearchBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Filter, SlidersHorizontal } from "lucide-react";
import { useGalleryData } from "../hooks/useGalleryData";


import {
  CATEGORY_TABS,
  matchesArtType,
  matchesCategory,
  matchesColor,
  matchesSize,
} from "../utils/artworkFilters";
import DropdownMenu from "../components/DropdownMenu";

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
  { value: "priceDesc", label: "Price high → low" },
  { value: "priceAsc", label: "Price low → high" },
];

const MarketplacePage = () => {
  const { users, artworks, loading } = useGalleryData();

  const [filters, setFilters] = useState({
    size: "any",
    color: "any",
    artType: "any",
  });

  const [category, setCategory] = useState("For You");
  const [sortOption, setSortOption] = useState("priceDesc");

  const [limit, setLimit] = useState(12);
  const sentinelRef = useRef(null);

  // Dropdown control
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const sortBtnRef = useRef(null);

  // Filtering + Sorting
  const filteredArtworks = useMemo(() => {
    return artworks
      .filter((art) => art.artworkType === "Marketplace")
      .filter((art) => matchesCategory(art, category))
      .filter((art) => matchesSize(art, filters.size))
      .filter((art) => matchesColor(art, filters.color))
      .filter((art) => matchesArtType(art, filters.artType))
      .sort((a, b) => {
        const priceA = a.price || 0;
        const priceB = b.price || 0;

        if (sortOption === "priceAsc") return priceA - priceB;
        return priceB - priceA; // default price high to low
      });
  }, [artworks, category, filters, sortOption]);

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

    return (
      <div key={art._id || art.id} className="flex flex-col items-start gap-2">
        <div className="aspect-[1/1] w-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            src={art.image}
            alt={art.title || "Artwork"}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="text-left w-full">
          <p className="font-semibold text-base text-gray-900">
            {art.title || "Untitled"}
          </p>
          <p className="text-sm text-gray-500">{username.startsWith('@') ? username : `@${username}`}</p>

          {/* PRICE HERE */}
          {art.price !== undefined && (
            <p className="text-base font-bold flex items-center gap-1">
              <span>{art.price}</span>
              SAR
            </p>


          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Navbar />
      <div className="pt-36 pb-16">
        <SearchBar variant="bar" />

        {/* CATEGORY + FILTER + SORT */}
        <div className="px-6 md:px-12 lg:px-20 mt-6 space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setCategory(tab)}
                className={`px-4 py-1.5 rounded-full font-medium border text-sm ${category === tab
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
                <button
                  className={`w-full py-4 px-6 text-base ${sortOption === "priceDesc" && "font-bold bg-gray-100"
                    }`}
                  onClick={() => {
                    setSortOption("priceDesc");
                    setIsSortOpen(false);
                  }}
                >
                  Price High → Low
                </button>

                <button
                  className={`w-full py-4 px-6 text-base ${sortOption === "priceAsc" && "font-bold bg-gray-100"
                    }`}
                  onClick={() => {
                    setSortOption("priceAsc");
                    setIsSortOpen(false);
                  }}
                >
                  Price Low → High
                </button>
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

      <div className="pt-96">
        <Footer />
      </div>

    </div>
  );
};

export default MarketplacePage;
