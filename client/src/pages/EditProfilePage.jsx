import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, logout, setUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    requirements: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    }
  });
  const [formData, setFormData] = useState({
    username: '',
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
              username: user.username || '',
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

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength when new password changes
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ 
        score: 0, 
        feedback: '',
        requirements: {
          length: false,
          lowercase: false,
          uppercase: false,
          number: false,
          special: false
        }
      });
      return;
    }

    let score = 0;
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password)
    };

    // Calculate score
    if (requirements.length) score += 1;
    if (requirements.lowercase) score += 1;
    if (requirements.uppercase) score += 1;
    if (requirements.number) score += 1;
    if (requirements.special) score += 1;

    setPasswordStrength({
      score,
      feedback: score === 5 ? 'Strong password' : '',
      requirements
    });
  };

  const handleChangePassword = async () => {
    if (!authUser?.id) {
      setPasswordError('Please log in to change your password.');
      return;
    }

    // Reset errors
    setPasswordError(null);

    // Validate all fields are filled
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    // Validate passwords match
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    // Validate password strength
    if (passwordStrength.score < 3) {
      setPasswordError('Password is too weak. Please use a stronger password.');
      return;
    }

    // Validate new password is different from current
    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);

    try {
      // Use the dedicated password change endpoint
      const response = await fetch(`${API_BASE_URL}/users/profile/${authUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          password: passwordFormData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password. Please check your current password.');
      }

      // Success
      toast.success('Password changed successfully!');
      
      // Reset form
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength({ 
        score: 0, 
        feedback: '',
        requirements: {
          length: false,
          lowercase: false,
          uppercase: false,
          number: false,
          special: false
        }
      });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
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
      
      // Update AuthContext user state to reflect the new banner image
      if (authUser && setUser) {
        setUser({
          ...authUser,
          bannerImage: imageUrl
        });
      }
      
      toast.success('Cover photo uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover photo. Please try again.');
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
      
      // Update AuthContext user state to reflect the new profile image
      if (authUser && setUser) {
        setUser({
          ...authUser,
          profileImage: imageUrl
        });
      }
      
      toast.success('Profile picture uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile picture. Please try again.');
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
      toast.error('Please log in to save your profile.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Prepare the update payload
      const updatePayload = {
        name: `${formData.firstName} ${formData.lastName}`.trim() || authUser.name, // Combine first and last name
        username: formData.username,
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

      // Note: Password changes are handled separately via the Change Password form

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
      
      // Update AuthContext user state to reflect the updated profile
      if (authUser && setUser) {
        setUser({
          ...authUser,
          name: updatePayload.name || authUser.name,
          username: formData.username || authUser.username,
          profileImage: profileImage,
          bannerImage: coverImage,
          artisticSpecialization: formData.artisticSpecialization || authUser.artisticSpecialization,
          bio: formData.bio || authUser.bio
        });
      }
      
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccountClick = () => {
    if (!authUser?.id) {
      toast.error('Please log in to delete your account.');
      return;
    }
    setShowDeleteWarning(true);
    setDeleteError(null);
  };

  const handleContinueDelete = () => {
    setShowDeleteWarning(false);
    setShowDeleteConfirmation(true);
    setDeletePassword('');
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    // Validate password
    if (!deletePassword) {
      setDeleteError('Please enter your current password.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Send DELETE request with password in body
      const response = await fetch(`${API_BASE_URL}/users/profile/${authUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: deletePassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account. Please check your password.');
      }

      toast.success('Your account has been deleted successfully.');
      setShowDeleteConfirmation(false);
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
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
          
          {/* Username field at the top */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-2">Username <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              required
              pattern="^[a-zA-Z0-9_]{3,30}$"
              placeholder="e.g. artbyname"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-700"
            />
            {(!formData.username || !/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) && (
              <div className="text-red-500 text-sm mt-1">A valid username is required (letters, numbers, underscores, 3-30 chars)</div>
            )}
          </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onFocus={handleFieldFocus}
                placeholder="Sara Alshareef.224"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

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
            {/* Password - Click to Change */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black bg-white flex items-center justify-between"
              >
                <span className="text-gray-600">
                  {showPasswordForm ? 'Hide password form' : 'Change password'}
                </span>
                {showPasswordForm ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>

            {/* Password Change Form */}
            {showPasswordForm && (
              <div className="col-span-1 md:col-span-2 bg-white rounded-lg p-6 space-y-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordFormChange}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordFormData.newPassword}
                      onChange={handlePasswordFormChange}
                      placeholder="Enter your new password"
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                    />
                    {/* Password Strength Checkmark */}
                    {passwordFormData.newPassword && passwordStrength.score === 5 && (
                      <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordFormData.confirmPassword}
                      onChange={handlePasswordFormChange}
                      placeholder="Confirm your new password"
                      className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black ${
                        passwordFormData.confirmPassword &&
                        passwordFormData.newPassword !== passwordFormData.confirmPassword
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    />
                    {/* Match Checkmark */}
                    {passwordFormData.confirmPassword &&
                      passwordFormData.newPassword === passwordFormData.confirmPassword &&
                      passwordFormData.newPassword && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                  </div>
                  {passwordFormData.confirmPassword &&
                    passwordFormData.newPassword !== passwordFormData.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                    )}
                </div>

                {/* Password Error Message */}
                {passwordError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{passwordError}</p>
                  </div>
                )}

                {/* Update Password Button */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordFormData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setPasswordStrength({ 
                        score: 0, 
                        feedback: '',
                        requirements: {
                          length: false,
                          lowercase: false,
                          uppercase: false,
                          number: false,
                          special: false
                        }
                      });
                      setPasswordError(null);
                    }}
                    className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="bg-black text-white px-8 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}

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

            {/* Social Media */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
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

            {/* Social Media */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
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
              disabled={isSaving || !formData.username || !/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)}
              className="bg-black text-white px-12 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleDeleteAccountClick}
              disabled={isDeleting}
              className="bg-red-900 text-white px-12 py-3 rounded-full hover:bg-red-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>

    {/* Delete Account Warning Dialog */}
    {showDeleteWarning && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Account</h2>
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete your account? This action cannot be undone. All your artworks and data will be permanently deleted.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteWarning(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm text-black"
            >
              Cancel
            </button>
            <button
              onClick={handleContinueDelete}
              className="px-6 py-2.5 bg-red-900 text-white rounded-full hover:bg-red-800 transition-colors font-medium text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Account Password Confirmation Dialog */}
    {showDeleteConfirmation && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Account Deletion</h2>
          <p className="text-gray-700 mb-6">
            To confirm account deletion, please enter your current password.
          </p>

          {/* Current Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError(null);
              }}
              placeholder="Enter your current password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            />
          </div>

          {/* Error Message */}
          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{deleteError}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowDeleteConfirmation(false);
                setDeletePassword('');
                setDeleteError(null);
              }}
              disabled={isDeleting}
              className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm text-black disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting || !deletePassword}
              className="px-6 py-2.5 bg-red-900 text-white rounded-full hover:bg-red-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}