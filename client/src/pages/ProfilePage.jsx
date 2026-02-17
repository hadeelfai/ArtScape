import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Bookmark, Image, X, Edit2, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar';
import { toast } from 'sonner';
import AdminProfile from "./AdminProfile";
import { useLikeSave } from '../context/LikeSaveContext.jsx';
import { TAG_GROUPS, normalizeTagList } from '../utils/tagDefinitions';

const DEFAULT_PROFILE_IMAGE = '/Profileimages/User.jpg';
const DEFAULT_BANNER_IMAGE = '/Profileimages/Cover.jpg';

export const getProfileImage = (image) => {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return DEFAULT_PROFILE_IMAGE;
  }
  return image.trim();
};

export const getBannerImage = (image) => {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return DEFAULT_BANNER_IMAGE;
  }
  return image.trim();
};

import { getApiBaseUrl } from '../config.js';

const createEmptyArtworkState = () => ({
  title: '',
  description: '',
  tags: [],
  dimensions: '',
  year: '',
  artworkType: 'Explore',
  price: '',
  imageFile: null,
  imagePreview: ''
});

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
        const response = await fetch(`${getApiBaseUrl()}/users/profile/${targetUserId}`, {
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

  const loggedInUserId = loggedInUserIdProp || authUser?.id || null;
  const resolvedProfileId = profileData?.id || routeUserId || null;
  const isOwnProfile = Boolean(loggedInUserId && resolvedProfileId && resolvedProfileId === loggedInUserId);

  // Check if current user is following this profile
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!authUser?.id || !resolvedProfileId || isOwnProfile) {
        setIsFollowing(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/users/profile/${authUser.id}/following`, {
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

    if (resolvedProfileId) {
      checkFollowingStatus();
    }
  }, [authUser?.id, resolvedProfileId, isOwnProfile]);

  // Create a stable reference for artworks using useMemo
  const mappedArtworks = useMemo(() => {
    const artworksToUse = profileData?.artworks && profileData.artworks.length > 0
      ? profileData.artworks
      : (artworksProp.length > 0 ? artworksProp : []);

    return artworksToUse.map(artwork => ({
      id: artwork._id || artwork.id,
      title: artwork.title || '',
      description: artwork.description || '',
      tags: normalizeTagList(artwork.tags),
      dimensions: artwork.dimensions || '',
      year: artwork.year || '',
      artworkType: artwork.artworkType || 'Explore',
      price: artwork.price || null,
      image: artwork.image || artwork.imageUrl // Support both field names
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
  const [newArtwork, setNewArtwork] = useState(() => createEmptyArtworkState());
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [isAddingArtwork, setIsAddingArtwork] = useState(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [isDeletingArtwork, setIsDeletingArtwork] = useState(null);
  const [artworkToDelete, setArtworkToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const showAddArtworkTile = isOwnProfile && activeTab === 'gallery' && !isAddingArtwork;

  const filteredTagGroups = useMemo(() => {
    const query = tagSearchTerm.trim().toLowerCase();
    if (!query) return TAG_GROUPS;

    return TAG_GROUPS
      .map(group => ({
        ...group,
        tags: group.tags.filter(tag => tag.toLowerCase().includes(query))
      }))
      .filter(group => group.tags.length > 0);
  }, [tagSearchTerm]);

  const handleToggleTag = (tag) => {
    setNewArtwork((prev) => {
      const exists = prev.tags.includes(tag);
      const tags = exists
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  const handleRemoveTag = (tag, event) => {
    event?.preventDefault();
    event?.stopPropagation();
    setNewArtwork((prev) => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const allTabs = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'saved', label: 'Saved', icon: Bookmark }
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
      const response = await fetch(`${getApiBaseUrl()}/users/profile/${targetUserId}`, {
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
      const response = await fetch(`${getApiBaseUrl()}/users/follow/${resolvedProfileId}`, {
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
    if (newArtwork.tags.length < 3) {
      toast.error('Please select at least three tags related to your artwork.');
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
        tags: newArtwork.tags,
        dimensions: newArtwork.dimensions || '',
        year: newArtwork.year || '',
        artworkType: newArtwork.artworkType,
        price: newArtwork.artworkType === 'Marketplace' ? Number(newArtwork.price) || 0 : null,
        image: imageUrl
      };

      const authHeaders = {
        'Content-Type': 'application/json',
        ...(authUser?.token && { Authorization: `Bearer ${authUser.token}` }),
      };
      let response;
      if (editingArtwork) {
        // Update existing artwork
        response = await fetch(`${getApiBaseUrl()}/artworks/${editingArtwork.id}`, {
          method: 'PUT',
          headers: authHeaders,
          credentials: 'include',
          body: JSON.stringify(artworkData)
        });
      } else {
        // Create new artwork (artist set server-side from auth)
        response = await fetch(`${getApiBaseUrl()}/artworks`, {
          method: 'POST',
          headers: authHeaders,
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
              tags: normalizeTagList(result.artwork.tags),
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
          tags: normalizeTagList(result.artwork.tags),
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
      setNewArtwork(createEmptyArtworkState());
      setTagSearchTerm('');
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
    setNewArtwork(createEmptyArtworkState());
    setTagSearchTerm('');
  };

  const handleEditArtwork = (artwork) => {
    const normalizedTags = normalizeTagList(artwork.tags);
    setEditingArtwork(artwork);
    setNewArtwork({
      title: artwork.title || '',
      description: artwork.description || '',
      tags: normalizedTags,
      dimensions: artwork.dimensions || '',
      year: artwork.year || '',
      artworkType: artwork.artworkType || 'Explore',
      price: artwork.price || '',
      imageFile: null,
      imagePreview: artwork.image || ''
    });
    setTagSearchTerm('');
    setIsAddingArtwork(true);
  };

  const handleDeleteArtwork = async (artworkId) => {
    // Show confirmation modal
    setArtworkToDelete(artworkId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteArtwork = async () => {
    if (!artworkToDelete) return;

    const artworkIdToDelete = artworkToDelete;
    setIsDeletingArtwork(artworkIdToDelete);
    setShowDeleteConfirm(false);

    try {
      const response = await fetch(`${getApiBaseUrl()}/artworks/${artworkIdToDelete}`, {
        method: 'DELETE',
        headers: {
          ...(authUser?.token && { Authorization: `Bearer ${authUser.token}` }),
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      // Remove from local state
      setArtworkList((prev) => prev.filter(art => art.id !== artworkIdToDelete));
      toast.success('Artwork deleted successfully!');
    } catch (error) {
      console.error('Error deleting artwork:', error);
      toast.error('Failed to delete artwork. Please try again.');
    } finally {
      setIsDeletingArtwork(null);
      setArtworkToDelete(null);
      setShowDeleteConfirm(false);
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

  const { liked, saved } = useLikeSave();
  const [likedArtworks, setLikedArtworks] = useState([]);
  const [savedArtworks, setSavedArtworks] = useState([]);

  // Fetch liked/saved artworks by their IDs
  useEffect(() => {
    async function fetchLikedSavedArtworks() {
      if (liked.length === 0 && saved.length === 0) {
        setLikedArtworks([]);
        setSavedArtworks([]);
        return;
      }

      try {
        // Fetch all artworks first
        const allArtworksRes = await fetch(`${getApiBaseUrl()}/artworks`, {
          credentials: 'include'
        });

        if (allArtworksRes.ok) {
          const allArtworks = await allArtworksRes.json();

          // Filter for liked artworks and sort by order in liked array (most recent first)
          const likedItems = allArtworks
            .filter(art => liked.includes(art._id || art.id))
            .map(art => ({
              id: art._id || art.id,
              title: art.title || '',
              description: art.description || '',
              tags: normalizeTagList(art.tags),
              dimensions: art.dimensions || '',
              year: art.year || '',
              artworkType: art.artworkType || 'Explore',
              price: art.price || null,
              image: art.image || art.imageUrl
            }))
            .sort((a, b) => {
              // Sort by position in liked array (most recent first)
              const aIndex = liked.indexOf(a.id);
              const bIndex = liked.indexOf(b.id);
              return bIndex - aIndex; // Reverse order (most recent first)
            });

          // Filter for saved artworks and sort by order in saved array (most recent first)
          const savedItems = allArtworks
            .filter(art => saved.includes(art._id || art.id))
            .map(art => ({
              id: art._id || art.id,
              title: art.title || '',
              description: art.description || '',
              tags: normalizeTagList(art.tags),
              dimensions: art.dimensions || '',
              year: art.year || '',
              artworkType: art.artworkType || 'Explore',
              price: art.price || null,
              image: art.image || art.imageUrl
            }))
            .sort((a, b) => {
              // Sort by position in saved array (most recent first)
              const aIndex = saved.indexOf(a.id);
              const bIndex = saved.indexOf(b.id);
              return bIndex - aIndex; // Reverse order (most recent first)
            });

          setLikedArtworks(likedItems);
          setSavedArtworks(savedItems);
        }
      } catch (error) {
        console.error('Error fetching liked/saved artworks:', error);
      }
    }

    if (isOwnProfile) {
      fetchLikedSavedArtworks();
    }
  }, [liked, saved, isOwnProfile]);
  const [open, setOpen] = useState(false);

  // If the user is signed out, auto-redirect to home (not SignIn)
  useEffect(() => {
    if (!isLoading && !profileData) {
      navigate('/', { replace: true });
    }
  }, [isLoading, profileData, navigate]);

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
  // If logged-in user is an admin, use the admin profile page instead
  if (authUser?.role === "admin") {
    return <AdminProfile />;
  }


  if (!profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-visible">
      <Navbar />

      <div className='pt-20'>
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && artworkToDelete && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setArtworkToDelete(null);
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Artwork</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this artwork? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setArtworkToDelete(null);
                  }}
                  className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm text-black"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteArtwork}
                  disabled={isDeletingArtwork === artworkToDelete}
                  className="px-6 py-2.5 bg-red-900 text-white rounded-full hover:bg-red-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingArtwork === artworkToDelete ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                    Tags <span className="text-xs text-gray-500">(select at least 3)</span>
                  </label>
                  <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
                    <div className="flex flex-wrap gap-2 min-h-[44px]">
                      {newArtwork.tags.length > 0 ? (
                        newArtwork.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-800">
                            {tag}
                            <button
                              type="button"
                              onClick={(event) => handleRemoveTag(tag, event)}
                              className="text-gray-500 hover:text-gray-900"
                              aria-label={`Remove ${tag}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No tags selected yet.</p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-gray-200">
                      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={tagSearchTerm}
                          onChange={(e) => setTagSearchTerm(e.target.value)}
                          placeholder="Search creative fields"
                          className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto p-4 space-y-5">
                        {filteredTagGroups.length === 0 ? (
                          <p className="text-sm text-gray-500">No tags match "{tagSearchTerm}".</p>
                        ) : (
                          filteredTagGroups.map(group => (
                            <div key={group.title} className="space-y-2">
                              <p className="text-xs uppercase tracking-wide text-gray-500">{group.title}</p>
                              <div className="space-y-2">
                                {group.tags.map(tag => {
                                  const isChecked = newArtwork.tags.includes(tag);
                                  return (
                                    <label key={tag} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleTag(tag)}
                                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                      />
                                      <span>{tag}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <p className={`mt-2 text-sm ${newArtwork.tags.length < 3 ? 'text-red-600' : 'text-gray-500'}`}>
                    {newArtwork.tags.length} of 3 required tags selected
                  </p>
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
        <div className="relative h-44 lg:h-72 bg-gradient-to-r from-blue-400 via-blue-300 to-yellow-200 overflow-visible">
          <img
            src={getBannerImage(profileData.bannerImage)}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
          {/* Profile Image - Overlaid on top of banner */}
          <div className="absolute bottom-0 left-6 lg:left-8 flex-shrink-0 z-20" style={{ transform: 'translateY(50%)' }}>
            <img
              src={getProfileImage(profileData.profileImage)}
              alt={profileData.name}
              className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-white object-cover"
            />
          </div>
        </div>

        {/* Profile Section */}
        <div className="max-w-7xl mx-auto px-2 relative z-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-2" style={{ paddingTop: '80px', minHeight: '120px' }}>
            {/* Profile Image and Info Container */}
            <div className="flex flex-row items-end w-full sm:w-auto">
              {/* Spacer for profile image (since it's absolutely positioned) */}
              <div className="w-32 sm:w-36 md:w-40 lg:w-48 flex-shrink-0"></div>

              {/* Profile Info - To the right of profile picture */}
              <div className="flex-1 pb-0 sm:pb-6 text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{profileData.name}</h1>
                {profileData.username && (
                  <p className="text-sm sm:text-base text-gray-500 mt-1">
                    {profileData.username.startsWith('@')
                      ? profileData.username
                      : `@${profileData.username}`}
                  </p>
                )}
                <p className="text-sm sm:text-base text-gray-600 mt-1 mb-2 sm:mb-3">
                  {profileData.artisticSpecialization}
                </p>
                {profileData.bio && (
                  <p className="text-sm sm:text-base text-gray-700 mt-3 sm:mt-4 mb-3 sm:mb-4 max-w-4xl leading-relaxed">
                    {profileData.bio}
                  </p>
                )}
                <div className="flex items-center justify-start space-x-4 sm:space-x-6 mt-2 text-xs sm:text-sm mb-3 sm:mb-4">
                  <Link
                    to={`/profile/${resolvedProfileId}/followers`}
                    className="hover:underline cursor-pointer"
                  >
                    <span><strong>{profileData.followers}</strong> Followers</span>
                  </Link>
                  <span className="text-gray-400">|</span>
                  <Link
                    to={`/profile/${resolvedProfileId}/following`}
                    className="hover:underline cursor-pointer"
                  >
                    <span><strong>{profileData.following}</strong> Following</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pb-0 sm:pb-6 w-full sm:w-auto flex justify-center sm:justify-end">
              {isOwnProfile ? (
                <div className="flex items-start gap-2 p-6 sm:gap-3">
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
                    className="bg-black text-white px-7 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleFollowClick}
                  className={`mb-6 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded-full transition-colors font-medium text-sm sm:text-base ${isFollowing
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
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-4">
                    {showAddArtworkTile && (
                      <button
                        type="button"
                        onClick={() => setIsAddingArtwork(true)}
                        className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors w-full aspect-square"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-gray-300 flex items-center justify-center mb-3 sm:mb-4">
                          <span className="text-4xl sm:text-5xl text-gray-400 leading-none">+</span>
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">Add New Artwork</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Click to add your artwork</p>
                      </button>
                    )}
                    {artworkList.map((artwork) => (
                      <Link to={`/artwork/${artwork.id}`} key={artwork.id} className="group block">
                        <div
                          className={`relative bg-white overflow-hidden ${artwork.artworkType === 'Marketplace' ? '' : ''}`}
                        >
                          <img
                            src={artwork.image && artwork.image.startsWith('http') ? artwork.image : '/Profileimages/User.jpg'}
                            alt={artwork.title || 'Artwork'}
                            className="aspect-square object-cover"
                            onError={e => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; }}
                          />
                          {/* Edit and Delete Buttons - Only show for own profile */}
                          {isOwnProfile && (
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditArtwork(artwork);
                                }}
                                className="p-1.5 sm:p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                                title="Edit artwork"
                              >
                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
                              </button>
                              <button
                                onClick={e => {
                                  e.preventDefault();
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
                                <span className="text-base sm:text-lg font-bold text-gray-900 mt-1 sm:mt-2 block">{artwork.price} SAR</span>
                              )}
                            </>
                          )}
                        </div>
                      </Link>
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
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-4">
                {likedArtworks.length === 0 ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">No liked artworks yet</div>
                ) : (
                  likedArtworks.map(artwork => (
                    <Link to={`/artwork/${artwork.id}`} key={artwork.id} className="group block">
                      <div
                        className={`relative bg-white overflow-hidden ${artwork.artworkType === 'Marketplace' ? '' : ''}`}
                      >
                        <img
                          src={artwork.image && artwork.image.startsWith('http') ? artwork.image : '/Profileimages/User.jpg'}
                          alt={artwork.title || 'Artwork'}
                          className="aspect-square object-cover"
                          onError={e => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; }}
                        />
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
                              <span className="text-base sm:text-lg font-bold text-gray-900 mt-1 sm:mt-2 block">{artwork.price} SAR</span>
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-4">
                {savedArtworks.length === 0 ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">No saved artworks yet</div>
                ) : (
                  savedArtworks.map(artwork => (
                    <Link to={`/artwork/${artwork.id}`} key={artwork.id} className="group block">
                      <div
                        className={`relative bg-white overflow-hidden ${artwork.artworkType === 'Marketplace' ? '' : ''}`}
                      >
                        <img
                          src={artwork.image && artwork.image.startsWith('http') ? artwork.image : '/Profileimages/User.jpg'}
                          alt={artwork.title || 'Artwork'}
                          className="aspect-square object-cover"
                          onError={e => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; }}
                        />
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
                              <span className="text-base sm:text-lg font-bold text-gray-900 mt-1 sm:mt-2 block">{artwork.price} SAR</span>
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}