import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingCart, Heart, Bookmark, Image, Clock } from 'lucide-react';

export default function ArtScapeProfile() {
  const { userId } = useParams(); // Get userId from URL
  const [userData, setUserData] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [loading, setLoading] = useState(true);
  
  const currentUserId = localStorage.getItem('userId'); // Logged-in user
  const isOwnProfile = currentUserId === userId;

  // ===== FETCH USER PROFILE DATA =====
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/users/profile/${userId}`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setUserData(data.user);
          setArtworks(data.artworks);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId]);
  

  const tabs = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'purchased', label: 'Purchased History', icon: Clock }
  ];

  const handleFollowClick = async () => {
    try {
      const response = await fetch(`http://localhost:5000/users/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ userId: currentUserId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsFollowing(data.isFollowing);
        // Update follower count
        setUserData(prev => ({
          ...prev,
          followers: data.isFollowing ? prev.followers + 1 : prev.followers - 1
        }));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleAddToCart = (artwork) => {
    console.log('Added to cart:', artwork);
    alert(`"${artwork.title}" added to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
    </div>
  );
}