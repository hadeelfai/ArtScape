import React, { useState } from 'react';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    username: 'Sara Alshareef 224',
    password: '••••••••••',
    firstName: 'Sara',
    lastName: 'Alshareef',
    phoneNumber: '+966 - 0974235864',
    email: 'SaraAlshareef.24@Gmail.Com',
    address: 'King Sattam St, Al-Rabwah, Jeddah 23433, Saudi Arabia',
    state: 'Makkah Provincse',
    country: 'Saudi Arabia',
    city: 'Jeddah',
    zipCode: '23431',
    dateOfBirthMonth: 'June',
    dateOfBirthDay: '26',
    dateOfBirthYear: '1999',
    gender: 'Male',
    artisticSpecialization: 'Oil Painter - Landscape Artist',
    instagram: 'https://www.instagram.com/Username_Name_art',
    twitter: 'https://twitter.com/Username@art',
    bio: 'Sara Alshareef is a passionate oil painter specializing in capturing the serene beauty of landscapes.'
  });
  
  const [profileImage, setProfileImage] = useState('/assets/images/profilepicture.jpg');
  const [coverImage, setCoverImage] = useState('/assets/images/profileheader.jpg');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = () => {
    console.log('Saving changes:', formData);
    alert('Profile updated successfully!');
    // In real app: send to backend API
  };

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
            <button className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm">
              Upload Cover Photo
            </button>
            <button className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm">
              Upload New Profile Picture
            </button>
          </div>
        </div>

        {/* Edit Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username - BLACK text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Password - BLACK text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* First Name - BLACK text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Last Name - BLACK text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Phone Number - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              />
            </div>

            {/* Email Address - BLACK text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Artistic Specialization - BLACK text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Artistic Specialization</label>
              <input
                type="text"
                name="artisticSpecialization"
                value={formData.artisticSpecialization}
                onChange={handleInputChange}
                placeholder="Oil Painter - Landscape Artist"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            {/* Address - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              />
            </div>

            {/* Country - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              >
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            {/* State - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              >
                <option value="Makkah Province">Makkah Province</option>
                <option value="Riyadh Province">Riyadh Province</option>
                <option value="Eastern Province">Eastern Province</option>
              </select>
            </div>

            {/* City - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              />
            </div>

            {/* Zip Code - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              />
            </div>

            {/* Date of Birth - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Of Birth</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  name="dateOfBirthMonth"
                  value={formData.dateOfBirthMonth}
                  onChange={handleInputChange}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  name="dateOfBirthDay"
                  value={formData.dateOfBirthDay}
                  onChange={handleInputChange}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <select
                  name="dateOfBirthYear"
                  value={formData.dateOfBirthYear}
                  onChange={handleInputChange}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gender - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Instagram - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                placeholder="https://www.instagram.com/Username_Name_art"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-500"
              />
            </div>

            {/* Twitter - GRAY text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
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

          {/* Bio - BLACK text */}
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