import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { toast } from 'sonner';

import { getApiBaseUrl } from '../config.js';

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
    district: '',
    streetName: '',
    additionalDetails: '',
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
  const [usernameTouched, setUsernameTouched] = useState(false);

  const [profileImage, setProfileImage] = useState('/Profileimages/User.jpg');
  const [coverImage, setCoverImage] = useState('/Profileimages/Cover.jpg');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const coverImageInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  const DEFAULT_PROFILE_IMAGE = '/Profileimages/User.jpg';
  const DEFAULT_COVER_IMAGE = '/Profileimages/Cover.jpg';

  const getProfileImage = (image) => {
    if (!image || typeof image !== 'string' || !image.trim()) {
      return DEFAULT_PROFILE_IMAGE;
    }
    return image.trim();
  };

  const getBannerImage = (image) => {
    if (!image || typeof image !== 'string' || !image.trim()) {
      return DEFAULT_COVER_IMAGE;
    }
    return image.trim();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.id) {
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
        const response = await fetch(`${getApiBaseUrl()}/users/profile/${authUser.id}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const user = data.user;

            let firstName = user.firstName || '';
            let lastName = user.lastName || '';

            if (!firstName && !lastName && user.name) {
              const nameParts = user.name.trim().split(/\s+/);
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }
            setFormData({
              username: user.username ? user.username.replace(/^@+/, '') : '',
              firstName: firstName,
              lastName: lastName,
              phoneNumber: user.phoneNumber || '',
              email: user.email || '',
              address: user.address || '',
              district: user.district || '',
              streetName: user.streetName || '',
              additionalDetails: user.additionalDetails || '',
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

            setProfileImage(getProfileImage(user.profileImage));
            setCoverImage(getBannerImage(user.bannerImage));
          }
        } else {
          setProfileImage(DEFAULT_PROFILE_IMAGE);
          setCoverImage(DEFAULT_COVER_IMAGE);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
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

    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;

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

    setPasswordError(null);

    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordStrength.score < 3) {
      setPasswordError('Password is too weak. Please use a stronger password.');
      return;
    }

    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/profile/${authUser.id}/password`, {
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

      toast.success('Password changed successfully!');
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

  const saveImageToBackend = async (imageType, imageUrl) => {
    if (!authUser?.id) return;

    try {
      const updatePayload = imageType === 'profile' 
        ? { profileImage: imageUrl }
        : { bannerImage: imageUrl };
      const response = await fetch(`${getApiBaseUrl()}/users/profile/${authUser.id}`, {
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

    const previewUrl = URL.createObjectURL(file);
    setCoverImage(previewUrl);

    setUploadingCover(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, 'profiles');
      setCoverImage(imageUrl);
      await saveImageToBackend('cover', imageUrl);

      if (authUser && setUser) {
        setUser({ ...authUser, bannerImage: imageUrl });
      }

      toast.success('Cover photo uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover photo. Please try again.');
      setCoverImage(DEFAULT_COVER_IMAGE);
    } finally {
      setUploadingCover(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);

    setUploadingProfile(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, 'profiles');
      setProfileImage(imageUrl);
      await saveImageToBackend('profile', imageUrl);

      if (authUser && setUser) {
        setUser({
          ...authUser,
          profileImage: imageUrl,
          avatar: imageUrl
        });
      }

      toast.success('Profile picture uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile picture. Please try again.');
      setProfileImage(DEFAULT_PROFILE_IMAGE);
    } finally {
      setUploadingProfile(false);
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
      const normalizedUsername = formData.username ? formData.username.trim().replace(/^@+/, '') : '';
      
      if (!normalizedUsername || normalizedUsername.length === 0) {
        setError('Username is required. Please enter a valid username.');
        setIsSaving(false);
        return;
      }

      const updatePayload = {
        name: `${formData.firstName} ${formData.lastName}`.trim() || authUser.name,
        username: normalizedUsername,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        address: [formData.streetName, formData.additionalDetails, formData.district, formData.city, formData.state, formData.zipCode, formData.country].filter(Boolean).join(', '),
        district: formData.district,
        streetName: formData.streetName,
        additionalDetails: formData.additionalDetails,
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
        profileImage: profileImage,
        bannerImage: coverImage
      };

      const response = await fetch(`${getApiBaseUrl()}/users/profile/${authUser.id}`, {
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

      if (authUser && setUser) {
        setUser({
          ...authUser,
          name: updatePayload.name || authUser.name,
          username: normalizedUsername || authUser.username,
          profileImage: profileImage,
          avatar: profileImage,
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
    if (!deletePassword) {
      setDeleteError('Please enter your current password.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/profile/${authUser.id}`, {
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
        let errorMessage = 'Failed to delete account. Please check your password.';

        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            if (response.status === 404) {
              errorMessage = 'Account deletion endpoint not found. Please contact support.';
            } else if (response.status === 401) {
              errorMessage = 'Invalid password. Please check your password and try again.';
            } else {
              errorMessage = 'Server error occurred. Please try again or contact support.';
            }
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = response.status === 404 
            ? 'Account deletion endpoint not found. Please contact support.'
            : 'An unexpected error occurred. Please try again.';
        }

        throw new Error(errorMessage);
      }

      toast.success('Your account has been deleted successfully.');
      setShowDeleteConfirmation(false);
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      const isParseError = error instanceof SyntaxError || error.message.includes('JSON') || error.message.includes('Unexpected token');
      setDeleteError(isParseError 
        ? 'Server error occurred. The server returned an invalid response. Please try again or contact support.'
        : error.message || 'Failed to delete account. Please try again.');
      toast.error(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFieldFocus = (e) => {
    if (typeof e.target.select === 'function') {
      requestAnimationFrame(() => e.target.select());
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
        <div className="relative h-44 lg:h-72 bg-gradient-to-r from-blue-400 via-blue-300 to-yellow-200 overflow-visible">
          <img
            src={getBannerImage(coverImage)}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          {/* Profile Image - Overlaid on banner */}
          <div className="absolute bottom-0 left-6 lg:left-8 z-20" style={{ transform: 'translateY(50%)' }}>
            <img
              src={getProfileImage(profileImage)}
              alt="Profile"
              className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-white object-cover"
            />
          </div>
        </div>

        {/* Profile Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-end justify-between mb-8" style={{ paddingTop: '100px', minHeight: '120px' }}>
            {/* Spacer for profile image (since it's absolutely positioned) */}
            <div className="w-40 md:w-48 flex-shrink-0"></div>

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
                  className="bg-black text-white px-4 py-1 lg:py-2.5 rounded-full hover:bg-gray-800 transition-colors font-normal text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="bg-black text-white px-4 py-1 lg:py-2.5 rounded-full hover:bg-gray-800 transition-colors font-normal text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingProfile ? 'Uploading...' : 'Upload New Profile Picture'}
                </button>
              </div>
            </div>
          </div>

          {/* Edit Profile Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h2>

            {/* 1. Account Information */}
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Account Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Row 1: Username (50%) | Password (50%) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={e => {
                    setFormData({ ...formData, username: e.target.value });
                    setUsernameTouched(true);
                  }}
                  onBlur={() => setUsernameTouched(true)}
                  required
                  pattern="^@?[a-zA-Z0-9_]{3,30}$"
                  placeholder="e.g. artbyname"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                />
                {usernameTouched && formData.username && !/^@?[a-zA-Z0-9_]{3,30}$/.test(formData.username) && (
                  <div className="text-red-500 text-sm mt-1">A valid username is required (letters, numbers, underscores, 3-30 chars)</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black bg-white flex items-center justify-between"
                >
                  <span className="text-gray-600">
                    {showPasswordForm ? 'Hide password form' : 'Change password'}
                  </span>
                  {showPasswordForm ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
                </div>
              </div>

              {/* Password Change Form - directly below Password row */}
              {showPasswordForm && (
                <div className="md:col-span-2 p-6 space-y-4 border border-gray-200 rounded-lg bg-gray-50/50">
                  <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div />
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
                        {passwordFormData.newPassword && passwordStrength.score === 5 && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordFormData.confirmPassword}
                          onChange={handlePasswordFormChange}
                          placeholder="Confirm your new password"
                          className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black ${passwordFormData.confirmPassword && passwordFormData.newPassword !== passwordFormData.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {passwordFormData.confirmPassword && passwordFormData.newPassword === passwordFormData.confirmPassword && passwordFormData.newPassword && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {passwordFormData.confirmPassword && passwordFormData.newPassword !== passwordFormData.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                  {passwordError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{passwordError}</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordStrength({ score: 0, feedback: '', requirements: { length: false, lowercase: false, uppercase: false, number: false, special: false } });
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

              {/* Row 2: First Name (50%) | Last Name (50%) */}
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

              {/* Row 3: Email Address (50%) | Phone Number (50%) */}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleInputChange}
                  onFocus={handleFieldFocus}
                  placeholder="+966597423586"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                />
              </div>

              {/* Row 4: Date of Birth (50%) | Gender (50%) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    name="dateOfBirthMonth"
                    value={formData.dateOfBirthMonth}
                    onChange={handleInputChange}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  >
                    {months.map(month => (<option key={month} value={month}>{month}</option>))}
                  </select>
                  <select
                    name="dateOfBirthDay"
                    value={formData.dateOfBirthDay}
                    onChange={handleInputChange}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  >
                    {days.map(day => (<option key={day} value={day}>{day}</option>))}
                  </select>
                  <select
                    name="dateOfBirthYear"
                    value={formData.dateOfBirthYear}
                    onChange={handleInputChange}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  >
                    {years.map(year => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* 2. Shipping & Address Details */}
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Shipping & Address Details</p>
            <div className="space-y-6 mb-8">
              {/* Row 1: Street Name (50%) | Building / Apartment (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Name</label>
                  <input
                    type="text"
                    name="streetName"
                    value={formData.streetName}
                    onChange={handleInputChange}
                    onFocus={handleFieldFocus}
                    placeholder="e.g. King Sattam St"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Building / Apartment</label>
                  <input
                    type="text"
                    name="additionalDetails"
                    value={formData.additionalDetails}
                    onChange={handleInputChange}
                    onFocus={handleFieldFocus}
                    placeholder="e.g. Building 5, Apt 12"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
              </div>
              {/* Row 2: District (50%) | City (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    onFocus={handleFieldFocus}
                    placeholder="e.g. Al-Rabwah"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
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
              </div>
              {/* Row 3: State / Province (50%) | Zip Code (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State / Province</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  >
                    <option value="">Select</option>
                    <option value="Makkah Province">Makkah Province</option>
                    <option value="Riyadh Province">Riyadh Province</option>
                    <option value="Eastern Province">Eastern Province</option>
                  </select>
                </div>
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
              </div>
              {/* Row 4: Country (100%) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                >
                  <option value="">Select</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>
            </div>

            {/* 3. Professional & Social Profile */}
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Professional & Social Profile</p>
            <div className="space-y-6 mb-8">
              {/* Row 1: Artistic Specialization (100%) */}
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
              {/* Row 2: Instagram URL (50%) | Twitter (X) URL (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    onFocus={handleFieldFocus}
                    placeholder="https://www.instagram.com/username"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter (X) URL</label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    onFocus={handleFieldFocus}
                    placeholder="https://twitter.com/username"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
              </div>
              {/* Row 3: Bio (Full Width - Large Text Area) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  onFocus={handleFieldFocus}
                  placeholder="Add Bio Here..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-black"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons - Save (Primary) & Delete Account (Danger) */}
            <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap items-center gap-4">
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-black text-white px-6 py-2.5 lg:px-12 lg:py-3 rounded-full hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleDeleteAccountClick}
                disabled={isDeleting}
                className="bg-red-900 text-white px-6 py-2.5 lg:px-12 lg:py-3 rounded-full hover:bg-red-800 transition-colors font-normal disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
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