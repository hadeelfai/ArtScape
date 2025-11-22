import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
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
    bio: ''
  });
  
  const [profileImage, setProfileImage] = useState('/Profileimages/User.jpg');
  const [coverImage, setCoverImage] = useState('/Profileimages/Cover.jpg');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const coverImageInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  // Default images - used as fallback
  const DEFAULT_PROFILE_IMAGE = '/Profileimages/User.jpg';
  const DEFAULT_COVER_IMAGE = '/Profileimages/Cover.jpg';

  // Fetch current profile data when page loads
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.id) {
        setIsLoading(false);
        return;
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
              bio: user.bio || ''
            });
            
            // Update images: use user's saved images if they exist, otherwise use defaults
            setProfileImage(user.profileImage || DEFAULT_PROFILE_IMAGE);
            setCoverImage(user.bannerImage || DEFAULT_COVER_IMAGE);
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
  }, [authUser?.id]);

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

  const handleFieldFocus = (event) => {
    const { target } = event;
    if (typeof target.select === 'function') {
      requestAnimationFrame(() => target.select());
    }
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
          src={coverImage}
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
              src={profileImage}
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
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
                name="instagram (Optional)"
                value={formData.instagram}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="https://www.instagram.com/Username_Name_art"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              />
            </div>

            {/* Twitter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="twitter (Optional)"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  onFocus={handleFieldFocus}
                  placeholder="https://twitter.com/Username@art"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
                />
                <button type="button" className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap flex items-center gap-1">
                  Add More Link
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
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

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-black text-white px-12 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}