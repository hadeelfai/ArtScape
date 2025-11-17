import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Bookmark, Image, Clock } from 'lucide-react';

export default function ArtScapeProfile({ 
  userData = {
    name: 'Sara Alshareef',
    artisticSpecialization: 'Oil Painter | Landscape Artist', 
    bio: 'Sara Alshareef is a passionate oil painter specializing in capturing the serene beauty of landscapes.', 
    followers: 385,
    following: 512,
    profileImage: '/assets/images/profilepicture.jpg',
    bannerImage: '/assets/images/profileheader.jpg'
  },
  artworks = [
    { id: 1, title: 'Nocturne of the Koi Pond', image: '/assets/images/painting1.jpg', price: 250 },
    { id: 2, title: "Midsummer's Enchanted Hill", image: '/assets/images/painting2.jpg', price: 320 },
    { id: 3, title: 'Daffodils and Contemplation', image: '/assets/images/painting3.jpg', price: 180 },
    { id: 4, title: 'Sunlit Path', image: '/assets/images/painting4.jpg', price: 290 }
  ],
  isOwnProfile = false
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-64 bg-gradient-to-r from-blue-400 via-blue-300 to-yellow-200">
        <img 
          src={userData.bannerImage} 
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
              src={userData.profileImage} 
              alt={userData.name} 
              className="w-48 h-48 rounded-full border-8 border-white shadow-xl bg-white"
              style={{ marginBottom: '7rem' }}
              
            />
            
            {/* Profile Info */}
            <div className="pb-6">
              <h1 className="text-3xl font-bold text-gray-900">{userData.name}</h1>
              <p className="text-gray-600 mt-1 mb-3"> 
                    {/* Assuming you've separated bio and specialization in userData, using the correct field here */}
                    {userData.artisticSpecialization} 
                </p>
              <div className="flex items-center space-x-6 mt-2 text-sm mb-4">
                <span><strong>{userData.followers}</strong> Followers</span>
                <span className="text-gray-400">|</span>
                <span><strong>{userData.following}</strong> Following</span>
              </div>
              <p className="text-gray-700 mt-5 mb-6 max-w-4xl leading-relaxed">
                {userData.bio && (
                                <p className="text-gray-700 mt-2 mb-6 max-w-4xl leading-relaxed">
                                    {userData.bio}
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
              {artworks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
                  {artworks.map((artwork) => (
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