import { useMemo } from "react";
import SearchBar from "../components/SearchBar";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from "react-router-dom";
import { Filter, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import { useGalleryData } from '../hooks/useGalleryData';
import { useCart } from '../context/CartContext.jsx';
import { toast } from 'sonner';

const MAX_DISPLAY = 8;

const GalleryPage = () => {
  const { users, artworks, loading } = useGalleryData();
  const { addToCart, cartItems } = useCart();

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
          <p className="font-semibold text-base text-gray-900">{art.title || 'Untitled'}</p>
          {showPrice && art.price && (
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
      <div className="flex-1 pt-36 pb-12">
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