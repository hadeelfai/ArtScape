import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext.jsx';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const query = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5500';
        const headers = {};
        if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;
        const response = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(searchQuery)}`, { headers });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user?.token]);

  const handleResultClick = (item) => {
    navigate(item.path);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-full transition"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Search Results</h1>
          </div>

          {/* Search Input */}
          <div className="relative mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, artworks, news, and more..."
              className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-300 rounded-lg outline-none focus:border-gray-900 transition"
            />
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          </div>

          {/* Results */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
              <p className="mt-4 text-gray-600">Searching...</p>
            </div>
          )}

          {!isLoading && !hasSearched && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">Enter a search term to get started</p>
            </div>
          )}

          {!isLoading && hasSearched && results.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                No results found for "<strong>{searchQuery}</strong>"
              </p>
              <p className="text-gray-400 mt-2">Try different keywords or browse our galleries</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div>
              <p className="text-gray-600 mb-6">
                Found <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for "<strong>{searchQuery}</strong>"
              </p>

              {/* Group results by type */}
              {['User', 'Artwork', 'Article', 'News'].map((type) => {
                const typeResults = results.filter(r => r.type === type);
                if (typeResults.length === 0) return null;

                return (
                  <div key={type} className="mb-10">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{type === 'User' ? 'People' : `${type}s`}</h2>
                    <div className="grid grid-cols-1 gap-4">
                      {typeResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleResultClick(item)}
                          className="bg-white p-5 rounded-lg border border-gray-200 hover:border-gray-900 hover:shadow-lg cursor-pointer transition duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">{item.subtitle || item.type}</p>
                            </div>
                            <span className="ml-4 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              {item.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
