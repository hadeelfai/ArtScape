import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Settings, Heart, Bookmark, Image, Clock, X, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar';
import SettingsSidebar from "../components/SettingsSidebar";
import { toast } from 'sonner';

const DEFAULT_PROFILE_IMAGE = '/Profileimages/User.jpg';
const DEFAULT_BANNER_IMAGE = '/Profileimages/Cover.jpg';

// Old backend defaults that should be replaced
const OLD_DEFAULT_PROFILE_IMAGE = '/assets/images/profilepicture.jpg';
const OLD_DEFAULT_BANNER_IMAGE = '/assets/images/profileheader.jpg';

// Helper function to get the correct image path, using defaults if needed
const getProfileImage = (image) => {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return DEFAULT_PROFILE_IMAGE;
  }
  const trimmed = image.trim();
  if (trimmed === OLD_DEFAULT_PROFILE_IMAGE || trimmed === '') {
    return DEFAULT_PROFILE_IMAGE;
  }
  return trimmed;
};

const getBannerImage = (image) => {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return DEFAULT_BANNER_IMAGE;
  }
  const trimmed = image.trim();
  if (trimmed === OLD_DEFAULT_BANNER_IMAGE || trimmed === '') {
    return DEFAULT_BANNER_IMAGE;
  }
  return trimmed;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export default function ArtScapeProfile({
  userData: userDataProp = null,
  artworks: artworksProp = [],
  loggedInUserId: loggedInUserIdProp = null
}) {
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadError(null);

      if (userDataProp) {
        setProfileData({
          ...userDataProp,
          profileImage: getProfileImage(userDataProp.profileImage),
          bannerImage: getBannerImage(userDataProp.bannerImage)
        });
        setIsLoading(false);
        return;
      }

      const targetUserId = routeUserId || authUser?.id;
      if (!targetUserId) {
        setProfileData(null);
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
              profileImage: getProfileImage(data.user.profileImage),
              bannerImage: getBannerImage(data.user.bannerImage),
              artworks: data.artworks || []
            });
          } else {
            // If no user data, use default profile
            setProfileData(null);
            setLoadError('User profile not found.');
          }
        } else {
          console.error('Failed to fetch profile');
          // Use default profile on error
          setProfileData(null);
          setLoadError('Failed to fetch profile.');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfileData(null);
        setLoadError('Error fetching profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [routeUserId, authUser?.id, userDataProp, location.key]);

  const resolvedProfileData = profileData;
  const loggedInUserId = loggedInUserIdProp || authUser?.id || null;
  const resolvedProfileId = resolvedProfileData?.id || routeUserId || null;
  const isOwnProfile = Boolean(loggedInUserId && resolvedProfileId && resolvedProfileId === loggedInUserId);

  // Check if current user is following this profile
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!authUser?.id || !resolvedProfileId || isOwnProfile) {
        setIsFollowing(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/profile/${authUser.id}/following`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const followingIds = (data.following || []).map(u => u.id);
          setIsFollowing(followingIds.includes(resolvedProfileId));
        }
      } catch (error) {
        console.error('Error checking following status:', error);
      }
    };

    checkFollowingStatus();
  }, [authUser?.id, resolvedProfileId, isOwnProfile]);

  // Create a stable reference for artworks using useMemo
  const mappedArtworks = useMemo(() => {
    const artworksToUse = profileData?.artworks && profileData.artworks.length > 0
      ? profileData.artworks
      : (artworksProp.length > 0 ? artworksProp : []);

    return artworksToUse.map(artwork => ({
      id: artwork._id || artwork.id,
      title: artwork.title,
      description: artwork.description,
      tags: artwork.tags,
      dimensions: artwork.dimensions,
      year: artwork.year,
      artworkType: artwork.artworkType || 'Explore',
      price: artwork.price,
      image: artwork.image
    }));
  }, [profileData, artworksProp]);

  const [artworkList, setArtworkList] = useState(() => mappedArtworks);
  const prevArtworksRef = useRef(JSON.stringify(mappedArtworks));

  // Update artworkList when profile data is fetched
  useEffect(() => {
    const currentArtworksStr = JSON.stringify(mappedArtworks);

    // Only update if the artworks have actually changed
    if (currentArtworksStr !== prevArtworksRef.current) {
      setArtworkList(mappedArtworks);
      prevArtworksRef.current = currentArtworksStr;
    }
  }, [mappedArtworks]);
  const [newArtwork, setNewArtwork] = useState({
    title: '',
    description: '',
    tags: '',
    dimensions: '',
    year: '',
    artworkType: 'Explore', // 'Explore' or 'Marketplace'
    price: '',
    imageFile: null,
    imagePreview: ''
  });
  const [isAddingArtwork, setIsAddingArtwork] = useState(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [isDeletingArtwork, setIsDeletingArtwork] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const showAddArtworkTile = isOwnProfile && activeTab === 'gallery' && !isAddingArtwork;

  const allTabs = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'purchased', label: 'Purchased History', icon: Clock }
  ];

  // Filter tabs based on whether viewing own profile
  const tabs = useMemo(() => {
    if (isOwnProfile) {
      return allTabs;
    }
    // Only show Gallery tab for other users' profiles
    return allTabs.filter(tab => tab.id === 'gallery');
  }, [isOwnProfile]);

  // Reset to gallery tab if viewing someone else's profile and on a restricted tab
  useEffect(() => {
    if (!isOwnProfile && activeTab !== 'gallery') {
      setActiveTab('gallery');
    }
  }, [isOwnProfile, activeTab]);

  // Function to refetch profile data
  const refetchProfile = async () => {
    const targetUserId = routeUserId || authUser?.id;
    if (!targetUserId || userDataProp) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile/${targetUserId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setProfileData({
            ...data.user,
            profileImage: getProfileImage(data.user.profileImage),
            bannerImage: getBannerImage(data.user.bannerImage),
            artworks: data.artworks || []
          });
        }
      }
    } catch (error) {
      console.error('Error refetching profile:', error);
    }
  };

  const handleFollowClick = async () => {
    if (!authUser?.id || !resolvedProfileId) {
      toast.error('Please log in to follow users');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/follow/${resolvedProfileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: authUser.id })
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        // Refresh profile data to update counts
        await refetchProfile();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to follow/unfollow user');
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to follow/unfollow user. Please try again.');
    }
  };

  const handleAddToCart = (artwork) => {
    console.log('Added to cart:', artwork);
    toast.success(`"${artwork.title}" added to cart!`);
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

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'post_mern');
    formData.append('folder', 'artworks');

    const response = await fetch('https://api.cloudinary.com/v1_1/dzedtbfld/image/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleArtworkSubmit = async (e) => {
    e.preventDefault();
    if (!newArtwork.title) {
      toast.error('Please provide a title for the artwork.');
      return;
    }
    if (newArtwork.artworkType === 'Marketplace' && !newArtwork.price) {
      toast.error('Please provide a price for marketplace artworks.');
      return;
    }
    if (!editingArtwork && !newArtwork.imageFile) {
      toast.error('Please upload an image for the artwork.');
      return;
    }

    if (!authUser?.id) {
      toast.error('Please log in to add artworks.');
      return;
    }

    setIsUploadingArtwork(true);

    try {
      let imageUrl = editingArtwork?.image || '';

      // Upload new image if provided
      if (newArtwork.imageFile) {
        imageUrl = await uploadImageToCloudinary(newArtwork.imageFile);
      }

      // Prepare artwork data
      const artworkData = {
        title: newArtwork.title,
        description: newArtwork.description || '',
        tags: newArtwork.tags || '',
        dimensions: newArtwork.dimensions || '',
        year: newArtwork.year || '',
        artworkType: newArtwork.artworkType,
        price: newArtwork.artworkType === 'Marketplace' ? Number(newArtwork.price) || 0 : null,
        image: imageUrl
      };

      let response;
      if (editingArtwork) {
        // Update existing artwork
        response = await fetch(`${API_BASE_URL}/artworks/${editingArtwork.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(artworkData)
        });
      } else {
        // Create new artwork
        artworkData.artist = authUser.id;
        response = await fetch(`${API_BASE_URL}/artworks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(artworkData)
        });
      }

      if (!response.ok) {
        throw new Error(editingArtwork ? 'Failed to update artwork' : 'Failed to save artwork');
      }

      const result = await response.json();

      if (editingArtwork) {
        // Update in local state
        setArtworkList((prev) => prev.map(art =>
          art.id === editingArtwork.id
            ? {
              ...art,
              title: result.artwork.title,
              description: result.artwork.description,
              tags: result.artwork.tags,
              dimensions: result.artwork.dimensions,
              year: result.artwork.year,
              artworkType: result.artwork.artworkType,
              price: result.artwork.price,
              image: result.artwork.image
            }
            : art
        ));
        toast.success('Artwork updated successfully!');
      } else {
        // Add to local state
        const artworkToAdd = {
          id: result.artwork._id,
          title: result.artwork.title,
          description: result.artwork.description,
          tags: result.artwork.tags,
          dimensions: result.artwork.dimensions,
          year: result.artwork.year,
          artworkType: result.artwork.artworkType,
          price: result.artwork.price,
          image: result.artwork.image
        };

        setArtworkList((prev) => [artworkToAdd, ...prev]);
        toast.success('Artwork published successfully!');
      }

      // Reset form
      setNewArtwork({
        title: '',
        description: '',
        tags: '',
        dimensions: '',
        year: '',
        artworkType: 'Explore',
        price: '',
        imageFile: null,
        imagePreview: ''
      });
      setIsAddingArtwork(false);
      setEditingArtwork(null);

      // Cleanup blob URL
      if (newArtwork.imagePreview && newArtwork.imageFile) {
        URL.revokeObjectURL(newArtwork.imagePreview);
      }
    } catch (error) {
      console.error('Error saving artwork:', error);
      toast.error(editingArtwork ? 'Failed to update artwork. Please try again.' : 'Failed to save artwork. Please try again.');
    } finally {
      setIsUploadingArtwork(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddingArtwork(false);
    setEditingArtwork(null);
    // Cleanup blob URL if exists
    if (newArtwork.imagePreview) {
      URL.revokeObjectURL(newArtwork.imagePreview);
    }
    setNewArtwork({
      title: '',
      description: '',
      tags: '',
      dimensions: '',
      year: '',
      artworkType: 'Explore',
      price: '',
      imageFile: null,
      imagePreview: ''
    });
  };

  const handleEditArtwork = (artwork) => {
    setEditingArtwork(artwork);
    setNewArtwork({
      title: artwork.title || '',
      description: artwork.description || '',
      tags: artwork.tags || '',
      dimensions: artwork.dimensions || '',
      year: artwork.year || '',
      artworkType: artwork.artworkType || 'Explore',
      price: artwork.price || '',
      imageFile: null,
      imagePreview: artwork.image || ''
    });
    setIsAddingArtwork(true);
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!window.confirm('Are you sure you want to delete this artwork? This action cannot be undone.')) {
      return;
    }

    setIsDeletingArtwork(artworkId);

    try {
      const response = await fetch(`${API_BASE_URL}/artworks/${artworkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      // Remove from local state
      setArtworkList((prev) => prev.filter(art => art.id !== artworkId));
      toast.success('Artwork deleted successfully!');
    } catch (error) {
      console.error('Error deleting artwork:', error);
      toast.error('Failed to delete artwork. Please try again.');
    } finally {
      setIsDeletingArtwork(null);
    }
  };

  // Cleanup blob URLs when component unmounts or artwork is added
  useEffect(() => {
    return () => {
      if (newArtwork.imagePreview) {
        const isUrlInUse = artworkList.some(art => art.image === newArtwork.imagePreview);
        if (!isUrlInUse) {
          URL.revokeObjectURL(newArtwork.imagePreview);
        }
      }
    };
  }, [artworkList]);


  const [open, setOpen] = useState(false);

  // If the user is signed out, auto-redirect to home (not SignIn)
  useEffect(() => {
    if (!isLoading && !resolvedProfileData) {
      navigate('/', { replace: true });
    }
  }, [isLoading, resolvedProfileData, navigate]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 flex items-center justify-center px-4">
          <p className="text-sm sm:text-base text-gray-600">Loading profile...</p>
        </div>
      </>
    );
  }

  if (!resolvedProfileData) {
    // You may want a brief fallback UI, but this should be nearly instant redirect
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-visible">
      <Navbar />

      {/* Modal Overlay - Moved to top level to ensure it's above Navbar */}
      {isAddingArtwork && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative z-[10000] mx-2 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-lg sm:rounded-t-2xl z-10">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{editingArtwork ? 'Edit Artwork' : 'Add New Artwork'}</h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleArtworkSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Artwork Type Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Type
                </label>
                <select
                  name="artworkType"
                  value={newArtwork.artworkType}
                  onChange={handleArtworkFieldChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="Explore">Explore</option>
                  <option value="Marketplace">Marketplace</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newArtwork.title}
                  onChange={handleArtworkFieldChange}
                  placeholder="Enter artwork title"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newArtwork.description}
                  onChange={handleArtworkFieldChange}
                  placeholder="Describe your artwork..."
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={newArtwork.tags}
                  onChange={handleArtworkFieldChange}
                  placeholder="e.g., abstract, painting, digital art (comma separated)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions
                </label>
                <input
                  type="text"
                  name="dimensions"
                  value={newArtwork.dimensions}
                  onChange={handleArtworkFieldChange}
                  placeholder="e.g., 24 x 36 inches, 50 x 70 cm"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="text"
                  name="year"
                  value={newArtwork.year}
                  onChange={handleArtworkFieldChange}
                  placeholder="e.g., 2024"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                />
              </div>

              {/* Price - Only show for Marketplace */}
              {newArtwork.artworkType === 'Marketplace' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (SAR)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={newArtwork.price}
                    onChange={handleArtworkFieldChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                    required={newArtwork.artworkType === 'Marketplace'}
                  />
                </div>
              )}

              {/* Upload Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkImageChange}
                  className="w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800 file:cursor-pointer cursor-pointer"
                  required={!editingArtwork}
                />
                {newArtwork.imagePreview && (
                  <div className="mt-3 sm:mt-4">
                    <img
                      src={newArtwork.imagePreview}
                      alt="Artwork preview"
                      className="w-full max-w-md h-48 sm:h-56 md:h-64 object-cover rounded-lg border border-gray-200 mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingArtwork}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isUploadingArtwork ? (editingArtwork ? 'Updating...' : 'Publishing...') : (editingArtwork ? 'Update' : 'Publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Hero Banner with Profile Image Overlaid */}
      <div className="relative h-32 sm:h-48 md:h-64 bg-gradient-to-r from-blue-400 via-blue-300 to-yellow-200">
        <img
          src={getBannerImage(resolvedProfileData.bannerImage)}
          alt="Profile banner"
          className="w-full h-full object-cover"
        />
        {/* Profile Image - Overlaid on top of banner */}
        <div className="absolute bottom-0 left-1/2 sm:left-6 lg:left-8 transform -translate-x-1/2 sm:translate-x-0 translate-y-1/2 flex-shrink-0 z-20">
          <img
            src={getProfileImage(resolvedProfileData.profileImage)}
            alt={resolvedProfileData.name}
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-1 border-white shadow-xl bg-white"
          />
        </div>
      </div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-0">
          {/* Profile Image and Info Container */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 w-full sm:w-auto">
            {/* Profile Info - Always in white area below banner */}
            <div className="pb-0 sm:pb-6 text-center sm:text-left w-full sm:w-auto pt-12 sm:pt-0 sm:ml-32 md:ml-40 lg:ml-48">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{resolvedProfileData.name}</h1>
              {resolvedProfileData.username && (
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  @{resolvedProfileData.username}
                </p>
              )}
              <p className="text-sm sm:text-base text-gray-600 mt-1 mb-2 sm:mb-3">
                {resolvedProfileData.artisticSpecialization}
              </p>
              {resolvedProfileData.bio && (
                <p className="text-sm sm:text-base text-gray-700 mt-3 sm:mt-4 mb-3 sm:mb-4 max-w-4xl leading-relaxed">
                  {resolvedProfileData.bio}
                </p>
              )}
              <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6 mt-2 text-xs sm:text-sm mb-3 sm:mb-4">
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
            </div>
          </div>

          {/* Action Button */}
          <div className="pb-0 sm:pb-6 w-full sm:w-auto flex justify-center sm:justify-end mt-0 sm:mt-0">
            {isOwnProfile ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Settings Icon Button */}
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="p-2 sm:p-2.5 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>

                <SettingsSidebar open={open} setOpen={setOpen} />

                {/* Edit Profile Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      navigate('/edit-profile');
                    } catch (error) {
                      console.error('Navigation error:', error);
                      window.location.href = '/edit-profile';
                    }
                  }}
                  className="bg-black text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <button
                onClick={handleFollowClick}
                className={`px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded-full transition-colors font-medium text-sm sm:text-base ${isFollowing
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
        <div className="bg-white border-b border-gray-200 mt-4 sm:mt-8">
          <div className="flex space-x-4 sm:space-x-8 md:space-x-12 px-2 sm:px-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 py-3 sm:py-4 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                    ? 'border-black text-black font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
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
              {artworkList.length > 0 || showAddArtworkTile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-4">
                  {showAddArtworkTile && (
                    <button
                      type="button"
                      onClick={() => setIsAddingArtwork(true)}
                      className="border-2 border-dashed border-gray-300 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors w-full aspect-[4/5] min-h-[280px] sm:min-h-[305px]"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-gray-300 flex items-center justify-center mb-3 sm:mb-4">
                        <span className="text-4xl sm:text-5xl text-gray-400 leading-none">+</span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">Add New Artwork</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Click to add your artwork</p>
                    </button>
                  )}
                  {artworkList.map((artwork) => (
                    <div key={artwork.id} className="group">
                      <div
                        className={`relative bg-white overflow-hidden rounded-lg hover:shadow-2xl transition-shadow ${artwork.artworkType === 'Marketplace' ? 'cursor-pointer' : ''}`}
                      >
                        <img
                          src={artwork.image}
                          alt={artwork.title}
                          className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover"
                        />
                        {/* Edit and Delete Buttons - Only show for own profile */}
                        {isOwnProfile && (
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditArtwork(artwork);
                              }}
                              className="p-1.5 sm:p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                              title="Edit artwork"
                            >
                              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteArtwork(artwork.id);
                              }}
                              disabled={isDeletingArtwork === artwork.id}
                              className="p-1.5 sm:p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Delete artwork"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 sm:mt-3">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-1">{artwork.title}</h3>
                        {artwork.artworkType === 'Explore' ? (
                          <>
                            {artwork.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">{artwork.description}</p>
                            )}
                          </>
                        ) : (
                          <>
                            {artwork.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">{artwork.description}</p>
                            )}
                            {artwork.price && (
                              <span className="text-base sm:text-lg font-bold text-gray-900 mt-1 sm:mt-2 block">{artwork.price} ر.س</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500 px-4">
                  <p className="text-sm sm:text-base">No artworks yet</p>
                </div>
              )}
            </>
          )}

          {/* Likes Tab */}
          {activeTab === 'likes' && (
            <div className="text-center py-8 sm:py-12 px-4">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500">No liked artworks yet</p>
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === 'saved' && (
            <div className="text-center py-8 sm:py-12 px-4">
              <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500">No saved artworks yet</p>
            </div>
          )}

          {/* Purchased History Tab */}
          {activeTab === 'purchased' && (
            <div className="text-center py-8 sm:py-12 px-4">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500">No purchase history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}