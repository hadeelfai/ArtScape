import React, { useState, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '••••••••••',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    state: '',
    country: '',
    city: '',
    zipCode: '',
    dateOfBirthMonth: 'January',
    dateOfBirthDay: '1',
    dateOfBirthYear: '2000',
    gender: 'Male',
    artisticSpecialization: '',
    instagram: '',
    twitter: '',
    bio: ''
  });
  
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user ID from localStorage or context
        const userId = localStorage.getItem('userId'); // or from your auth context
        
        const response = await fetch(`http://localhost:5000/users/${userId}`, {
          credentials: 'include'
        });
        
        const userData = await response.json();
        
        if (response.ok) {
          setFormData({
            username: userData.username || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phoneNumber: userData.phoneNumber || '',
            email: userData.email || '',
            address: userData.address || '',
            state: userData.state || '',
            country: userData.country || '',
            city: userData.city || '',
            zipCode: userData.zipCode || '',
            dateOfBirthMonth: userData.dateOfBirth?.month || 'January',
            dateOfBirthDay: userData.dateOfBirth?.day || '1',
            dateOfBirthYear: userData.dateOfBirth?.year || '2000',
            gender: userData.gender || 'Male',
            artisticSpecialization: userData.artisticSpecialization || '',
            instagram: userData.socialLinks?.instagram || '',
            twitter: userData.socialLinks?.twitter || '',
            bio: userData.bio || ''
          });
          
          setProfileImage(userData.profileImage);
          setCoverImage(userData.bannerImage);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileImageUpload = (imageUrl) => {
    setProfileImage(imageUrl);
  };

  const handleCoverImageUpload = (imageUrl) => {
    setCoverImage(imageUrl);
  };

  const handleSaveChanges = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      const updatedData = {
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
        dateOfBirth: {
          month: formData.dateOfBirthMonth,
          day: formData.dateOfBirthDay,
          year: formData.dateOfBirthYear
        },
        gender: formData.gender,
        artisticSpecialization: formData.artisticSpecialization,
        socialLinks: {
          instagram: formData.instagram,
          twitter: formData.twitter
        },
        bio: formData.bio,
        profileImage,
        bannerImage: coverImage
      };

      const response = await fetch(`http://localhost:5000/users/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error updating profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => 2024 - i);

  return (
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
            <ImageUploader
              onImageUpload={handleCoverImageUpload}
              folder="artscape/covers"
              buttonText="Upload Cover Photo"
              buttonClassName="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm"
              showIcon={false}
            />
            <ImageUploader
              onImageUpload={handleProfileImageUpload}
              folder="artscape/profiles"
              buttonText="Upload New Profile Picture"
              buttonClassName="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm"
              showIcon={false}
            />
          </div>
        </div>

        {/* Edit Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* All your existing form fields stay the same */}
            {/* ... */}
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Add Bio Here..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-black"
            />
          </div>

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSaveChanges}
              className="bg-black text-white px-12 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}