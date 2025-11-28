import { useMemo } from "react";
import SearchBar from "../components/SearchBar";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from "react-router-dom";
import { Filter, SlidersHorizontal } from 'lucide-react';
import { useGalleryData } from '../hooks/useGalleryData';

const MAX_DISPLAY = 8;

const GalleryPage = () => {
  const { users, artworks, loading } = useGalleryData();

  const latestExplore = useMemo(() => (
    artworks
      .filter(art => art.artworkType === 'Explore')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_DISPLAY)
  ), [artworks]);

  const latestMarketplace = useMemo(() => (
    artworks
      .filter(art => art.artworkType === 'Marketplace')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_DISPLAY)
  ), [artworks]);

  const lookupUser = (id) => users.find(user => user._id === id || user.id === id);

  const renderCard = (art, showPrice = false) => {
    const user = lookupUser(art.artist) || {};
    const username = user.username || user.name?.replace(/\s+/g, '').toLowerCase() || 'artist';
    const avatarUrl = user.avatar || user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

    return (
      <div key={art._id || art.id} className="flex flex-col items-start gap-2">
        <div className="aspect-[1/1] w-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            src={art.image}
            alt={art.title || 'Artwork'}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left w-full">
          <div className="flex items-center gap-2 mb-1">
            <img
              src={avatarUrl}
              alt={username}
              className="w-6 h-6 rounded-full object-cover"
            />
            <p className="text-sm text-gray-500">{username.startsWith('@') ? username : `@${username}`}</p>
          </div>
          <p className="font-semibold text-base text-gray-900">{art.title || 'Untitled'}</p>
          {showPrice && art.price && (
            <p className="text-sm font-medium text-gray-900 mt-1">{art.price} SAR</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Navbar />
      <div className="pt-36 pb-12">
        <SearchBar variant="bar" />

        <section className="px-6 md:px-12 lg:px-20 mt-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-highcruiser text-3xl md:text-4xl lg:text-5xl">Explore</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to={'/explore'} className="text-md font-medium underline underline-offset-2 text-black">See More</Link>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-600">Loading Explore artworks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {latestExplore.map(art => renderCard(art, false))}
            </div>
          )}
        </section>

        <section className="px-6 md:px-12 lg:px-20 mt-16">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-highcruiser text-3xl md:text-4xl lg:text-5xl">Marketplace</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to={'/marketplace'} className="text-md font-medium underline underline-offset-2 text-black">See More</Link>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-600">Loading Marketplace artworks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {latestMarketplace.map(art => renderCard(art, true))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default GalleryPage;