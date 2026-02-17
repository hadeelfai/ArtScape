import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Send, Share2, Bookmark, Flag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext.jsx';
import ReportModal from '../components/ReportModal';
import { useLikeSave } from '../context/LikeSaveContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { normalizeTagList } from '../utils/tagDefinitions';

import { getApiBaseUrl } from '../config.js';

const ArtworkDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { liked, saved, likeArtwork, unlikeArtwork, saveArtwork, unsaveArtwork } = useLikeSave();
  const [likes, setLikes] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const { addToCart } = useCart();
  const { user: authUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [similar, setSimilar] = useState([]);

  // Fetch similar artworks from recommendation service
  useEffect(() => {
    const artworkId = artwork?._id || artwork?.id;
    if (!artworkId) return;
    const fetchSimilar = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/recommendations/similar?artworkId=${artworkId}&topK=8`);
        if (res.ok) {
          const data = await res.json();
          const items = ((data && data.recommendations) || []).map(rec => ({
            _id: rec.artwork_id,
            id: rec.artwork_id,
            title: rec.title,
            image: rec.image,
            artist: rec.artist_id,
            price: rec.price,
            tags: rec.tags || []
          }));
          setSimilar(items);
        } else {
          setSimilar([]);
        }
      } catch (err) {
        console.error('Error fetching similar artworks:', err);
        setSimilar([]);
      }
    };
    fetchSimilar();
  }, [artwork?._id, artwork?.id]);

  // View tracking - persists to User.viewedArtworks for recommendations
  useEffect(() => {
    if (!authUser?._id || !authUser?.token || !artwork?._id) return;

    const startTime = Date.now();

    const handleUnload = () => {
      const duration = (Date.now() - startTime) / 1000; // seconds
      fetch(`${getApiBaseUrl()}/artworks/${artwork._id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authUser.token}`
        },
        body: JSON.stringify({ duration }),
        keepalive: true
      });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [authUser, artwork]);


  

  // Fetch artwork and artist
  useEffect(() => {
    async function fetchArtworkAndArtist() {
      setLoading(true);
      setError("");
      try {
        const artworkRes = await fetch(`${getApiBaseUrl()}/artworks/${id}`);
        if (!artworkRes.ok) throw new Error('Artwork not found');
        const artworkData = await artworkRes.json();
        const normalizedArtwork = {
          ...artworkData,
          tags: normalizeTagList(artworkData.tags)
        };
        setArtwork(normalizedArtwork);
        setLikes(Array.isArray(normalizedArtwork.likes) ? normalizedArtwork.likes.length : (normalizedArtwork.likes || 0));
        // Fetch artist
        const userId = artworkData.artist;
        if (userId) {
          const artistRes = await fetch(`${getApiBaseUrl()}/users/profile/${userId}`);
          if (artistRes.ok) {
            const artistData = await artistRes.json();
            setArtist(artistData.user || artistData);
            
            // Check if current user is following this artist
            const currentUserId = authUser?.id || authUser?._id;
            const artistUserId = artistData.user?._id || artistData.user?.id || userId;
            if (currentUserId && String(currentUserId) !== String(artistUserId)) {
              try {
                const followCheckRes = await fetch(`${getApiBaseUrl()}/users/profile/${currentUserId}/following`, {
                  credentials: 'include'
                });
                if (followCheckRes.ok) {
                  const followData = await followCheckRes.json();
                  const followingIds = (followData.following || []).map(u => String(u.id || u._id));
                  setIsFollowing(followingIds.includes(String(artistUserId)));
                }
              } catch (err) {
                console.error('Error checking follow status:', err);
              }
            }
          }
        }
      } catch (err) {
        setError('Unable to load artwork.');
      } finally {
        setLoading(false);
      }
    }
    fetchArtworkAndArtist();
  }, [id]);

  const handleShare = () => {
    try {
      const shareUrl = `${window.location.origin}/artwork/${id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Artwork link copied!');
      } else {
        window.prompt('Copy this link:', shareUrl);
      }
    } catch (err) {
      toast.error('Failed to copy.');
    }
  };

  const handleFollow = async () => {
    const artistId = artist?._id || artist?.id || artwork?.artist;
    const currentUserId = authUser?.id || authUser?._id;
    
    if (!currentUserId) {
      toast.error('Please log in to follow users');
      return;
    }
    
    if (!artistId) {
      toast.error('Artist information not available');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/follow/${artistId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: currentUserId })
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        toast.success(data.isFollowing ? 'Followed successfully' : 'Unfollowed successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to follow/unfollow user');
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to follow/unfollow user. Please try again.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center bg-white">Loading artwork...</div>;
  }
  if (error || !artwork) {
    return <div className="min-h-screen flex justify-center items-center bg-white">{error || 'Artwork not found.'}</div>;
  }

  const isLiked = liked.includes(artwork._id || artwork.id);
  const isSaved = saved.includes(artwork._id || artwork.id);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12 pt-28">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Column - Image & Artist */}
          <div className="space-y-6">
            {/* Artist Info */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const artistId = artist?._id || artist?.id || artwork?.artist;
                  if (artistId) navigate(`/profile/${artistId}`);
                }}
                className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                {artist?.profileImage ? (
                  <img src={artist.profileImage} alt={artist.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-medium text-gray-600">{artist?.username?.[0]?.toUpperCase() || '?'}</span>
                )}
              </button>
              <div className="flex-1">
                <button 
                  onClick={() => {
                    const artistId = artist?._id || artist?.id || artwork?.artist;
                    if (artistId) navigate(`/profile/${artistId}`);
                  }}
                  className="font-medium text-gray-900 hover:underline cursor-pointer text-left"
                >
                  {artist?.username ? `@${artist.username}` : 'Unknown Artist'}
                </button>
              </div>
              {(() => {
                const artistId = artist?._id || artist?.id || artwork?.artist;
                const currentUserId = authUser?.id || authUser?._id;
                // Only show follow button if artist exists, user is logged in, and it's not their own profile
                if (artistId && currentUserId && String(artistId) !== String(currentUserId)) {
                  return (
                    <button 
                      className={`px-4 py-1.5 text-sm font-medium border rounded hover:bg-gray-50 transition-colors ${isFollowing ? 'border-gray-300 bg-gray-100' : 'border-gray-300'}`}
                      onClick={handleFollow}
                    >
                      {isFollowing ? 'Following' : 'Follow +'}
                    </button>
                  );
                }
                return null;
              })()}
            </div>
            {/* Artwork Image */}
            <div className="bg-gray-100 overflow-hidden relative flex justify-center items-center" style={{ minHeight: 300 }}>
              {artwork.image && artwork.image.startsWith('http') ? (
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  style={{ maxWidth: '100%', maxHeight: '75vh', height: 'auto', width: 'auto', display: 'block', margin: '0 auto' }}
                  onError={e => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; e.target.alt = 'No image'; }}
                />
              ) : (
                <img
                  src="/Profileimages/User.jpg"
                  alt="No artwork image"
                  style={{ maxWidth: '100%', maxHeight: '75vh', height: 'auto', width: 'auto', display: 'block', margin: '0 auto' }}
                />
              )}
            </div>
          </div>         
          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{artwork.title}</h1>
              {artwork.description && <p className="text-gray-700 leading-relaxed">{artwork.description}</p>}
            </div>
            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Tags:</span>
              {artwork.tags && Array.isArray(artwork.tags)
                ? artwork.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">{tag}</span>
                ))
                : artwork.tags && (
                  <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">{artwork.tags}</span>
                )}
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const artworkId = artwork._id || artwork.id;
                  if (isLiked) {
                    await unlikeArtwork(artworkId);
                  } else {
                    await likeArtwork(artworkId);
                  }
                  // Refetch artwork to get updated likes count
                  try {
                    const artworkRes = await fetch(`${getApiBaseUrl()}/artworks/${artworkId}`);
                    if (artworkRes.ok) {
                      const artworkData = await artworkRes.json();
                      setLikes(Array.isArray(artworkData.likes) ? artworkData.likes.length : (artworkData.likes || 0));
                    }
                  } catch (err) {
                    console.error('Error refetching artwork:', err);
                  }
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded hover:bg-gray-50 transition-colors ${isLiked ? 'border-red-500 text-red-500' : 'border-gray-300 text-gray-700'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
                <span className="text-sm font-medium">{likes}</span>
              </button>
              <button
                onClick={() => (isSaved ? unsaveArtwork(artwork._id || artwork.id) : saveArtwork(artwork._id || artwork.id))}
                className={`flex items-center justify-center p-2 border rounded hover:bg-gray-50 transition-colors ${isSaved ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-700'}`}
                title="Save"
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-blue-500' : ''}`} />
              </button>
              <button onClick={handleShare} className="flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors" title="Share">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={() => setShowReport(true)} className="flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors" title="Report">
                <Flag className="w-5 h-5" />
              </button>
            </div>
            {/* Price and Add to Cart */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">{artwork.price ? artwork.price : ''}</span>
                {artwork.price && <span className="text-xl text-gray-600">SAR</span>}
              </div>
              {artwork.artworkType === 'Marketplace' && (
                <button className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-2" onClick={async () => { 
                  const success = await addToCart(artwork, (error) => {
                    toast.error(error);
                  });
                  if (success) {
                    toast.success('Added to cart!');
                  }
                }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add To Cart
                </button>
              )}
            </div>

          </div>
        </div>

        {/* More Like This - Similar artworks */}
        {similar.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {similar.map((item) => (
                <Link
                  key={item._id || item.id}
                  to={`/artwork/${item._id || item.id}`}
                  className="group flex flex-col"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100 rounded-lg mb-2">
                    <img
                      src={item.image?.startsWith('http') ? item.image : '/Profileimages/User.jpg'}
                      alt={item.title || 'Artwork'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 capitalize">
                    {item.tags?.[0] || item.title || 'Artwork'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
      {showReport &&
        <ReportModal onClose={() => setShowReport(false)} artworkId={artwork._id || artwork.id} />
      }
      
    </div>
    
  );

  
};

export default ArtworkDetailsPage;