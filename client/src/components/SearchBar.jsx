// src/components/SearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const SearchBar = ({ variant = "icon" }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const debounceTimerRef = useRef(null);

  // Perform real-time search as user types
  useEffect(() => {
    if (!isSearchOpen) return;
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset results if search is empty
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    // Set debounced search
    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5500';
        const headers = {};
        if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;
        const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(searchQuery)}`, { headers });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, isSearchOpen, user?.token]);

  
  // Click result -> navigate
  const onClickResult = (item) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    // navigate to item's path
    if (item.path) navigate(item.path);
  };

  // Close search and reset state
  const handleClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ---------- BAR VARIANT ----------
  if (variant === "bar") {
    return (
      <div className="max-w-5xl mx-auto px-4 relative">

        {/* Search bar */}
        <div className="relative max-w-4xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full px-6 py-3 bg-white border border-gray-200 rounded-full outline-none focus:border-gray-300 transition"
            />
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          {/* Dropdown */}
          {isSearchOpen && (
            <>
              {/* Backdrop to close */}
              <div className="fixed inset-0 z-10" onClick={handleClose} />

              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 max-h-[600px] overflow-y-auto">
                <div className="p-6">

                  {/* Loading */}
                  {isLoading && (
                    <p className="text-center text-gray-500 py-10">Loading...</p>
                  )}

                  {/* Empty start */}
                  {!isLoading && !searchQuery.trim() && (
                    <p className="text-center text-gray-400 py-10">
                      Start typing to search the website...
                    </p>
                  )}

                  {/* Results */}
                  {!isLoading && searchQuery.trim() && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Search Results</h2>

                      {searchResults.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {searchResults.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => onClickResult(item)}
                              className="cursor-pointer px-4 py-3 rounded-lg hover:bg-gray-50 transition"
                            >
                              <p className="font-medium text-gray-800">{item.title}</p>
                              <p className="text-sm text-gray-500">{item.subtitle || item.type}</p>
                            </div>
                          ))}

                          <div className="border-t pt-4 mt-2">
                            <button
                              onClick={() => {
                                // go to full search page with query param
                                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                                setIsSearchOpen(false);
                              }}
                              className="text-sm font-medium hover:underline flex items-center gap-1"
                            >
                              Show more results →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-10">
                          No results found for "{searchQuery}"
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- ICON (MODAL) VARIANT ----------
  return (
    <>
      <button
        onClick={() => setIsSearchOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <Search className="w-5 h-5" />
      </button>

      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">

            {/* Close */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                placeholder="Search"
                className="w-full px-6 py-4 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-gray-300"
              />
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Content */}
            {isLoading ? (
              <p className="text-center text-gray-500 py-10">Loading...</p>
            ) : !searchQuery.trim() ? (
              <p className="text-center text-gray-400 py-10">Start typing to search the website...</p>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-4">Search Results</h2>

                {searchResults.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onClickResult(item)}
                        className="cursor-pointer px-4 py-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <p className="font-medium text-gray-800">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.subtitle || item.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    No results found for "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBar;
