import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingCart, Heart, Bookmark, Image, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar';

const DEFAULT_PROFILE = {
  id: 'user-1',
  name: 'ArtScape Artist',
  artisticSpecialization: 'Mixed Media Artist',
  bio: 'Welcome to ArtScape! Update your profile to share your story.',
  followers: 0,
  following: 0,
  profileImage: '/Profileimages/User.jpg',
  bannerImage: '/Profileimages/Cover.jpg',
  artworks: []
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export default function ArtScapeProfile({ 
  userData: userDataProp = null,
  artworks: artworksProp = [],
  loggedInUserId: loggedInUserIdProp = null
}) {
  const { userId: routeUserId } = useParams();
  const { user: authUser, getUserById } = useAuth();
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      if (userDataProp) {
        setProfileData(userDataProp);
        setIsLoading(false);
        return;
      }

      const targetUserId = routeUserId || authUser?.id;
      if (!targetUserId) {
        setProfileData(DEFAULT_PROFILE);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/users/profile/${targetUserId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setProfileData({
              ...data.user,
              artworks: data.artworks || []
            });
          }
        } else {
          console.error('Failed to fetch profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [routeUserId, authUser?.id, userDataProp]);

  const resolvedProfileData = profileData;
  const resolvedArtworks = artworksProp.length > 0 ? artworksProp : (profileData.artworks || []);

  const loggedInUserId = loggedInUserIdProp || authUser?.id || DEFAULT_PROFILE.id;
  const resolvedProfileId = resolvedProfileData?.id || DEFAULT_PROFILE.id;
  const isOwnProfile = resolvedProfileId === loggedInUserId;

  const [artworkList, setArtworkList] = useState(() => artworksProp.length > 0 ? artworksProp : []);

  // Update artworkList when profile data is fetched
  useEffect(() => {
    if (profileData.artworks && profileData.artworks.length > 0) {
      setArtworkList(profileData.artworks);
    } else if (artworksProp.length > 0) {
      setArtworkList(artworksProp);
    }
  }, [profileData.artworks, artworksProp]);
  const [newArtwork, setNewArtwork] = useState({
    title: '',
    price: '',
    imageFile: null,
    imagePreview: ''
  });
  const [isAddingArtwork, setIsAddingArtwork] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const showAddArtworkTile = isOwnProfile && activeTab === 'gallery' && !isAddingArtwork;

  const tabs = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'purchased', label: 'Purchased History', icon: Clock }
  ];

  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
  };

  const handleAddToCart = (artwork) => {
    console.log('Added to cart:', artwork);
    alert(`"${artwork.title}" added to cart!`);
  };

  const handleArtworkFieldChange = (e) => {
    const { name, value } = e.target;
    setNewArtwork((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArtworkImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setNewArtwork((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl
    }));
  };

  const handleArtworkSubmit = (e) => {
    e.preventDefault();
    if (!newArtwork.title || !newArtwork.price) {
      alert('Please provide a title and price for the artwork.');
      return;
    }
    if (!newArtwork.imagePreview) {
      alert('Please upload an image for the artwork.');
      return;
    }

    const artworkToAdd = {
      id: Date.now(),
      title: newArtwork.title,
      price: Number(newArtwork.price) || 0,
      image: newArtwork.imagePreview
    };

    setArtworkList((prev) => [artworkToAdd, ...prev]);
    setNewArtwork({
      title: '',
      price: '',
      imageFile: null,
      imagePreview: ''
    });
    setIsAddingArtwork(false);
  };

  // Cleanup blob URLs when form is cancelled (not when submitted)
  useEffect(() => {
    if (!isAddingArtwork && newArtwork.imagePreview) {
      // Form was closed, check if URL is still in use
      const isUrlInUse = artworkList.some(art => art.image === newArtwork.imagePreview);
      if (!isUrlInUse) {
        URL.revokeObjectURL(newArtwork.imagePreview);
      }
    }
  }, [isAddingArtwork]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
        
      {/* Hero Banner */}
      <div className="relative h-64 bg-gradient-to-r from-blue-400 via-blue-300 to-yellow-200">
        <img 
          src={resolvedProfileData.bannerImage} 
          alt="Profile banner" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex items-end justify-between">
          {/* Profile Image */}
          <div className="flex items-end space-x-6">
            <img 
              src={resolvedProfileData.profileImage} 
              alt={resolvedProfileData.name} 
              className="w-48 h-48 rounded-full border-8 border-white shadow-xl bg-white"
              style={{ marginBottom: '7rem' }}
              
            />
            
            {/* Profile Info */}
            <div className="pb-6">
              <h1 className="text-3xl font-bold text-gray-900">{resolvedProfileData.name}</h1>
              <p className="text-gray-600 mt-1 mb-3"> 
                    {/* Assuming you've separated bio and specialization in userData, using the correct field here */}
                    {resolvedProfileData.artisticSpecialization} 
                </p>
              <div className="flex items-center space-x-6 mt-2 text-sm mb-4">
                <Link 
                  to={`/profile/${resolvedProfileId}/followers`}
                  className="hover:underline cursor-pointer"
                >
                  <span><strong>{resolvedProfileData.followers}</strong> Followers</span>
                </Link>
                <span className="text-gray-400">|</span>
                <Link 
                  to={`/profile/${resolvedProfileId}/following`}
                  className="hover:underline cursor-pointer"
                >
                  <span><strong>{resolvedProfileData.following}</strong> Following</span>
                </Link>
              </div>
              <p className="text-gray-700 mt-5 mb-6 max-w-4xl leading-relaxed">
                {resolvedProfileData.bio && (
                                <p className="text-gray-700 mt-2 mb-6 max-w-4xl leading-relaxed">
                                    {resolvedProfileData.bio}
                                </p>
                            )}
              </p>
              
            </div>
          </div>

          {/* Action Button */}
          <div className="pb-6">
            {isOwnProfile ? (
              <Link to="/edit-profile">
                <button className="bg-black text-white px-8 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium">
                  Edit Profile
                </button>
              </Link>
            ) : (
              <button 
                onClick={handleFollowClick}
                className={`px-8 py-2.5 rounded-full transition-colors font-medium ${
                  isFollowing 
                    ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
        
        {/* Divider line */}
        <div className="border-b border-gray-200 mt-0"></div>

        {/* Tabs Navigation */}
        <div className="bg-white border-b border-gray-200 mt-8">
          <div className="flex space-x-12 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-black text-black font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8 mb-16 bg-white">
          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <>
              {isOwnProfile && activeTab === 'gallery' && isAddingArtwork && (
                <form
                  onSubmit={handleArtworkSubmit}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mx-4 mb-10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Artwork</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingArtwork(false);
                        setNewArtwork({
                          title: '',
                          price: '',
                          imageFile: null,
                          imagePreview: ''
                        });
                      }}
                      className="text-sm text-gray-500 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={newArtwork.title}
                        onChange={handleArtworkFieldChange}
                        placeholder="Artwork title"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (KSA)</label>
                      <input
                        type="number"
                        name="price"
                        value={newArtwork.price}
                        onChange={handleArtworkFieldChange}
                        placeholder="0.00"
                        min="0"
                        step="1"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleArtworkImageChange}
                        className="w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800"
                      />
                    </div>
                  </div>
                  {newArtwork.imagePreview && (
                    <div className="mt-4 flex items-center gap-4">
                      <img
                        src={newArtwork.imagePreview}
                        alt="Artwork preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <p className="text-sm text-gray-500">Preview of your upload</p>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                    >
                      Upload Artwork
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingArtwork(false);
                        setNewArtwork({
                          title: '',
                          price: '',
                          imageFile: null,
                          imagePreview: ''
                        });
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {artworkList.length > 0 || showAddArtworkTile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
                  {showAddArtworkTile && (
                    <button
                      type="button"
                      onClick={() => setIsAddingArtwork(true)}
                      className="border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-center p-6 mx-auto bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors"
                      style={{ width: '245px', height: '305px' }}
                    >
                      <div className="w-20 h-20 rounded-full border border-gray-300 flex items-center justify-center mb-4">
                        <span className="text-5xl text-gray-400 leading-none">+</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">Add New Artwork</p>
                      <p className="text-sm text-gray-500 mt-1">Upload title, price, and image</p>
                    </button>
                  )}
                  {artworkList.map((artwork) => (
                    <div key={artwork.id} className="group cursor-pointer">
                      <div className="bg-white border-4 border-gray-800 overflow-hidden hover:shadow-2xl transition-shadow">
                        <img 
                          src={artwork.image} 
                          alt={artwork.title}
                          className="w-full h-72 object-cover"
                        />
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900">{artwork.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">${artwork.price}</span>
                            <button 
                              onClick={() => handleAddToCart(artwork)}
                              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <ShoppingCart className="w-5 h-5 text-gray-700" />
                            </button>
                          </div>
                        </div>
                        <div className="w-16 h-1 bg-gray-800 mt-2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No artworks yet</p>
                </div>
              )}
            </>
          )}

          {/* Likes Tab */}
          {activeTab === 'likes' && (
            <div className="text-center py-12 px-4">
              <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No liked artworks yet</p>
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === 'saved' && (
            <div className="text-center py-12 px-4">
              <Bookmark className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No saved artworks yet</p>
            </div>
          )}

          {/* Purchased History Tab */}
          {activeTab === 'purchased' && (
            <div className="text-center py-12 px-4">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No purchase history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}