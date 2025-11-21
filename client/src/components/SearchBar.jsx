import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ variant = "icon" }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch recommendations (same as modal)
    const fetchRecommendations = async () => {
        setIsLoading(true);
        setTimeout(() => {
            setRecommendations([
                { id: 1, title: 'The Red Eye', author: '@shamaas', image: '/grid/red.gif' },
                { id: 2, title: 'Creatures', author: '@marjanbian', image: '/grid/creature.jpeg' },
                { id: 3, title: 'Poison', author: '@c5m2h3', image: '/grid/juice.jpg' }
            ]);
            setIsLoading(false);
        }, 400);
    };

    // Perform search
    const performSearch = async (query) => {
        if (!query.trim()) return setSearchResults([]);

        setIsLoading(true);
        setTimeout(() => {
            setSearchResults([
                { id: 4, title: 'Garden On Film', author: '@Hadeel', image: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400&h=300&fit=crop' },
                { id: 5, title: 'Brunch', author: '@Mashael', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop' },
                { id: 6, title: 'Faces', author: '@Hanan', image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400&h=300&fit=crop' }
            ]);
            setIsLoading(false);
        }, 400);
    };

    // Fetch recommendations on open (navbar) OR first render (gallery search bar)
    useEffect(() => {
        if (variant === "bar") fetchRecommendations();
    }, []);

    // Search effect
    useEffect(() => {
        if (variant === "bar" && isSearchOpen) {
            const timer = setTimeout(() => performSearch(searchQuery), 300);
            return () => clearTimeout(timer);
        }
    }, [searchQuery, isSearchOpen]);

    if (variant === "bar") {
        const isShowingRecommendations = !searchQuery.trim();

        return (
            <div className="max-w-5xl mx-auto px-4 relative">
                
                {/* Search bar with dropdown */}
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

                    {/* Dropdown Panel */}
                    {isSearchOpen && (
                        <>
                            {/* Backdrop to close dropdown */}
                            <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setIsSearchOpen(false)}
                            />
                            
                            {/* Dropdown Content */}
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 max-h-[600px] overflow-y-auto">
                                <div className="p-6">
                                    {/* Loading state */}
                                    {isLoading && (
                                        <p className="text-center text-gray-500 py-10">Loading...</p>
                                    )}

                                    {/* Recommendations */}
                                    {!isLoading && isShowingRecommendations && (
                                        <div>
                                            <h2 className="text-lg font-semibold mb-4">Based On What You Like</h2>

                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                {recommendations.map((item) => (
                                                    <div key={item.id} className="group cursor-pointer">
                                                        <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-gray-100">
                                                            <img
                                                                src={item.image}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                            />
                                                        </div>
                                                        <h3 className="text-sm font-medium mt-2">{item.title}</h3>
                                                        <p className="text-xs text-gray-500">{item.author}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="border-t pt-4">
                                                <button className="text-sm font-medium hover:underline flex items-center gap-1">
                                                    Show me more results →
                                                </button>
                                                <p className="text-xs text-gray-500 mt-1">1,535 results</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Search Results */}
                                    {!isLoading && searchQuery.trim() && (
                                        <div>
                                            <h2 className="text-lg font-semibold mb-4">Search Results</h2>

                                            {searchResults.length > 0 ? (
                                                <>
                                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                                        {searchResults.map((item) => (
                                                            <div key={item.id} className="group cursor-pointer">
                                                                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.title}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                    />
                                                                </div>
                                                                <h3 className="text-sm font-medium mt-2">{item.title}</h3>
                                                                <p className="text-xs text-gray-500">{item.author}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="border-t pt-4">
                                                        <button className="text-sm font-medium hover:underline flex items-center gap-1">
                                                            Show me more results →
                                                        </button>
                                                    </div>
                                                </>
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

    return (
        <>
            <button
                onClick={() => { setIsSearchOpen(true); fetchRecommendations(); }}
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
                                onClick={() => setIsSearchOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search bar */}
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

                        {isLoading ? (
                            <p className="text-center text-gray-500 py-10">Loading...</p>
                        ) : !searchQuery.trim() ? (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Based On What You Like</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recommendations.map((item) => (
                                        <div key={item.id} className="group">
                                            <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                                />
                                            </div>
                                            <h3 className="mt-2 text-lg font-medium">{item.title}</h3>
                                            <p className="text-sm text-gray-500">{item.author}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Search Results</h2>

                                {searchResults.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {searchResults.map((item) => (
                                            <div key={item.id} className="group">
                                                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                                                    <img
                                                        src={item.image}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                                    />
                                                </div>
                                                <h3 className="mt-2 text-lg font-medium">{item.title}</h3>
                                                <p className="text-sm text-gray-500">{item.author}</p>
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