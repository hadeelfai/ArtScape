import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    //username: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '+966',
    email: '',
    address: '',
    state: '',
    country: '',
    city: '',
    zipCode: '',
    dateOfBirthMonth: '',
    dateOfBirthDay: '',
    dateOfBirthYear: '',
    gender: '',
    artisticSpecialization: '',
    instagram: '',
    twitter: '',
    link: '',
    bio: ''
  });
  
  const [profileImage, setProfileImage] = useState('/Profileimages/User.jpg');
  const [coverImage, setCoverImage] = useState('/Profileimages/Cover.jpg');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [additionalLinks, setAdditionalLinks] = useState([]);
  const coverImageInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  // Default images - used as fallback
  const DEFAULT_PROFILE_IMAGE = '/Profileimages/User.jpg';
  const DEFAULT_COVER_IMAGE = '/Profileimages/Cover.jpg';

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
      return DEFAULT_COVER_IMAGE;
    }
    const trimmed = image.trim();
    if (trimmed === OLD_DEFAULT_BANNER_IMAGE || trimmed === '') {
      return DEFAULT_COVER_IMAGE;
    }
    return trimmed;
  };

  // Fetch current profile data when page loads
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.id) {
        // Wait a moment for auth context to initialize, then redirect if still no user
        const checkAuth = setTimeout(() => {
          if (!authUser?.id) {
            navigate('/signin');
          }
        }, 500);
        setIsLoading(false);
        return () => clearTimeout(checkAuth);
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/users/profile/${authUser.id}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const user = data.user;
            
            // Split name into firstName and lastName if needed
            let firstName = user.firstName || '';
            let lastName = user.lastName || '';
            
            // If firstName/lastName are empty but name exists, try to split it
            if (!firstName && !lastName && user.name) {
              const nameParts = user.name.trim().split(/\s+/);
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }
            
            // Populate form with fetched data
            setFormData({
              password: '', // Don't populate password
              firstName: firstName,
              lastName: lastName,
              phoneNumber: user.phoneNumber || '+966',
              email: user.email || '',
              address: user.address || '',
              state: user.state || '',
              country: user.country || '',
              city: user.city || '',
              zipCode: user.zipCode || '',
              dateOfBirthMonth: user.dateOfBirth?.month || '',
              dateOfBirthDay: user.dateOfBirth?.day || '',
              dateOfBirthYear: user.dateOfBirth?.year || '',
              gender: user.gender || '',
              artisticSpecialization: user.artisticSpecialization || '',
              instagram: user.socialLinks?.instagram || '',
              twitter: user.socialLinks?.twitter || '',
              link: user.socialLinks?.link || user.link || '',
              bio: user.bio || ''
            });
            
            // Update images: use user's saved images if they exist, otherwise use defaults
            setProfileImage(getProfileImage(user.profileImage));
            setCoverImage(getBannerImage(user.bannerImage));
          }
        } else {
          console.error('Failed to fetch profile');
          // Set default images on fetch failure
          setProfileImage(DEFAULT_PROFILE_IMAGE);
          setCoverImage(DEFAULT_COVER_IMAGE);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Set default images on error
        setProfileImage(DEFAULT_PROFILE_IMAGE);
        setCoverImage(DEFAULT_COVER_IMAGE);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [authUser?.id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadImageToCloudinary = async (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'post_mern');
    formData.append('folder', folder);

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

  // Helper function to save image to backend
  const saveImageToBackend = async (imageType, imageUrl) => {
    if (!authUser?.id) return;

    try {
      // Create update payload with only the image field
      // The backend will only update the fields provided, preserving other data
      const updatePayload = {};
      
      if (imageType === 'profile') {
        updatePayload.profileImage = imageUrl;
      } else if (imageType === 'cover') {
        updatePayload.bannerImage = imageUrl;
      }

      // Save to backend
      const response = await fetch(`${API_BASE_URL}/users/profile/${authUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save image');
      }
    } catch (error) {
      console.error('Error saving image to backend:', error);
      throw error;
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setCoverImage(previewUrl);

    setUploadingCover(true);
    try {
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file, 'profiles');
      setCoverImage(imageUrl);
      
      // Save to backend immediately
      await saveImageToBackend('cover', imageUrl);
      
      alert('Cover photo uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload cover photo. Please try again.');
      // Revert to previous image on error
      setCoverImage(DEFAULT_COVER_IMAGE);
    } finally {
      setUploadingCover(false);
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);

    setUploadingProfile(true);
    try {
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file, 'profiles');
      setProfileImage(imageUrl);
      
      // Save to backend immediately
      await saveImageToBackend('profile', imageUrl);
      
      alert('Profile picture uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile picture. Please try again.');
      // Revert to previous image on error
      setProfileImage(DEFAULT_PROFILE_IMAGE);
    } finally {
      setUploadingProfile(false);
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSaveChanges = async () => {
    if (!authUser?.id) {
      alert('Please log in to save your profile.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Prepare the update payload
      const updatePayload = {
        name: `${formData.firstName} ${formData.lastName}`.trim() || authUser.name, // Combine first and last name
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        country: formData.country,
        city: formData.city,
        zipCode: formData.zipCode,
        dateOfBirthMonth: formData.dateOfBirthMonth,
        dateOfBirthDay: formData.dateOfBirthDay,
        dateOfBirthYear: formData.dateOfBirthYear,
        gender: formData.gender,
        artisticSpecialization: formData.artisticSpecialization,
        instagram: formData.instagram,
        twitter: formData.twitter,
        link: formData.link,
        bio: formData.bio,
        profileImage: profileImage, // Include uploaded profile image URL
        bannerImage: coverImage    // Include uploaded cover image URL
      };

      // Only include password if it's been changed
      if (formData.password && formData.password.trim() !== '') {
        updatePayload.password = formData.password;
      }

      const response = await fetch(`${API_BASE_URL}/users/profile/${authUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      alert('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!authUser?.id) {
      alert('Please log in to delete your account.');
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your artworks and data will be permanently deleted.'
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile/${authUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      alert('Your account has been deleted successfully.');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFieldFocus = (event) => {
    const { target } = event;
    if (typeof target.select === 'function') {
      requestAnimationFrame(() => target.select());
    }
  };

  const handleAddMoreLink = () => {
    if (additionalLinks.length >= 2) {
      alert('You can only add up to 2 additional links.');
      return;
    }
    setAdditionalLinks([...additionalLinks, { id: Date.now(), url: '' }]);
  };

  const handleAdditionalLinkChange = (id, value) => {
    setAdditionalLinks(additionalLinks.map(link => 
      link.id === id ? { ...link, url: value } : link
    ));
  };

  const handleRemoveLink = (id) => {
    setAdditionalLinks(additionalLinks.filter(link => link.id !== id));
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => 2024 - i);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-400 via-blue-300 to-yellow-200">
        <img 
          src={getBannerImage(coverImage)}
          alt="Cover" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex items-end justify-between mb-8">
          {/* Profile Image */}
          <div className="relative">
            <img 
              src={getProfileImage(profileImage)}
              alt="Profile" 
              className="w-48 h-48 rounded-full border-8 border-white shadow-xl bg-white object-cover"
            />
          </div>

          {/* Upload Buttons */}
          <div className="flex gap-3 pb-4">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                ref={coverImageInputRef}
                onChange={handleCoverImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverImageInputRef.current?.click()}
                disabled={uploadingCover}
                className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingCover ? 'Uploading...' : 'Upload Cover Photo'}
              </button>
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                ref={profileImageInputRef}
                onChange={handleProfileImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => profileImageInputRef.current?.click()}
                disabled={uploadingProfile}
                className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingProfile ? 'Uploading...' : 'Upload New Profile Picture'}
              </button>
            </div>
          </div>
        </div>

        {/* Edit Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* First Name  */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="Sara"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="Alshareef"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>
            {/* Password  */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="••••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Phone Number  */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
               
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
               
              />
            </div>

            {/* Email Address  */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="Sara.Alshareef1@Gmail.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Artistic Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Artistic Specialization</label>
              <input
                type="text"
                name="artisticSpecialization"
                value={formData.artisticSpecialization}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="Oil Painter - Landscape Artist"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Address  */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="King Sattam St, Al-Rabwah, Jeddah 23433, Saudi Arabia"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Country  */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              >
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            {/* State  */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              >
                <option value="Makkah Province">Makkah Province</option>
                <option value="Riyadh Province">Riyadh Province</option>
                <option value="Eastern Province">Eastern Province</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="Jeddah"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Zip Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="23433"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Of Birth</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  name="dateOfBirthMonth"
                  value={formData.dateOfBirthMonth}
                  onChange={handleInputChange}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  name="dateOfBirthDay"
                  value={formData.dateOfBirthDay}
                  onChange={handleInputChange}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <select
                  name="dateOfBirthYear"
                  value={formData.dateOfBirthYear}
                  onChange={handleInputChange}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="https://www.instagram.com/Username_Name_art"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              />
            </div>

            {/* Twitter and Additional Links */}
            <div>
              <div className="flex flex-nowrap gap-4 items-start">
                {/* Twitter Field */}
                <div className="flex-shrink-0" style={{ width: '250px' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    onFocus={handleFieldFocus}
                    placeholder="https://twitter.com/Username@art"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
                  />
                </div>
                
                {/* Additional Links - appear next to Twitter in the same row */}
                {additionalLinks.map((link, index) => (
                  <div key={link.id} className="flex-shrink-0" style={{ width: '280px' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link {index + 1}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleAdditionalLinkChange(link.id, e.target.value)}
                        onFocus={handleFieldFocus}
                        placeholder="https://example.com/your-link"
                        className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(link.id)}
                        className="px-3 py-2.5 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add More Link Button */}
                <div className="flex-shrink-0" style={{ paddingTop: '28px' }}>
                  <button 
                    type="button" 
                    onClick={handleAddMoreLink}
                    disabled={additionalLinks.length >= 2}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap flex items-center gap-1 transition-colors px-4 py-2.5 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-blue-600"
                  >
                    Add More Link
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              onFocus={handleFieldFocus}
              placeholder="Add Bio Here..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-black"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Save and Delete Buttons */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-black text-white px-12 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-900 text-white px-12 py-3 rounded-full hover:bg-red-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}