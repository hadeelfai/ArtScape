import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export default function FollowersFollowingPage() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  
  // Determine which tab to show based on URL path
  const getDefaultTab = () => {
    if (location.pathname.includes('/following')) return 'following';
    return 'followers';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userName, setUserName] = useState('User');
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = authUser?.id;
  const targetUserId = userId || currentUserId;
  const isOwnProfile = userId === currentUserId || (!userId && currentUserId);

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);

  // Function to fetch user profile info
  const fetchUserInfo = useCallback(async () => {
    if (!targetUserId) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile/${targetUserId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUserName(data.user.name || 'User');
          setFollowersCount(data.user.followers || 0);
          setFollowingCount(data.user.following || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }, [targetUserId]);

  // Fetch user profile info on mount
  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  // Fetch followers/following data
  useEffect(() => {
    const fetchData = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        setFollowers([]);
        setFollowing([]);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch current user's following list to check isFollowing status
        let currentUserFollowing = [];
        if (currentUserId) {
          try {
            const currentUserResponse = await fetch(`${API_BASE_URL}/users/profile/${currentUserId}/following`, {
              credentials: 'include'
            });
            if (currentUserResponse.ok) {
              const currentUserData = await currentUserResponse.json();
              currentUserFollowing = (currentUserData.following || []).map(u => u.id);
            }
          } catch (error) {
            console.error('Error fetching current user following:', error);
          }
        }
        
        // Fetch followers
        const followersResponse = await fetch(`${API_BASE_URL}/users/profile/${targetUserId}/followers`, {
          credentials: 'include'
        });
        
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          const followersWithStatus = (followersData.followers || []).map(follower => ({
            ...follower,
            isFollowing: currentUserFollowing.includes(follower.id)
          }));
          setFollowers(followersWithStatus);
          setFollowersCount(followersData.count || 0);
        }

        // Fetch following
        const followingResponse = await fetch(`${API_BASE_URL}/users/profile/${targetUserId}/following`, {
          credentials: 'include'
        });
        
        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          const followingWithStatus = (followingData.following || []).map(followed => ({
            ...followed,
            // If viewing own profile, all are being followed. Otherwise check current user's following list.
            isFollowing: isOwnProfile ? true : currentUserFollowing.includes(followed.id)
          }));
          setFollowing(followingWithStatus);
          setFollowingCount(followingData.count || 0);
        }
      } catch (error) {
        console.error('Error fetching followers/following:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, currentUserId, isOwnProfile]);

  const handleFollowToggle = async (targetUserId, listType) => {
    if (!currentUserId) {
      toast.error('Please log in to follow users');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/follow/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: currentUserId })
      });

      if (response.ok) {
        const data = await response.json();
        const newIsFollowing = data.isFollowing;

        // Update local state
        if (listType === 'followers') {
          setFollowers(followers.map(user => 
            user.id === targetUserId 
              ? { ...user, isFollowing: newIsFollowing }
              : user
          ));
        } else {
          setFollowing(following.map(user => 
            user.id === targetUserId 
              ? { ...user, isFollowing: newIsFollowing }
              : user
          ));
        }

        // Show success message
        toast.success(newIsFollowing ? 'Followed successfully' : 'Unfollowed successfully');

        // Refresh user info to get updated counts
        // This updates the profile being viewed (their followers count if we followed them)
        await fetchUserInfo();
        
        // If we followed/unfollowed the profile owner (the user whose profile we're viewing),
        // refresh the followers/following lists to get updated counts
        const profileOwnerId = userId || currentUserId;
        if (targetUserId === profileOwnerId) {
          // Refresh the lists to get updated counts
          const followersResponse = await fetch(`${API_BASE_URL}/users/profile/${profileOwnerId}/followers`, {
            credentials: 'include'
          });
          if (followersResponse.ok) {
            const followersData = await followersResponse.json();
            setFollowersCount(followersData.count || 0);
          }
          
          const followingResponse = await fetch(`${API_BASE_URL}/users/profile/${profileOwnerId}/following`, {
            credentials: 'include'
          });
          if (followingResponse.ok) {
            const followingData = await followingResponse.json();
            setFollowingCount(followingData.count || 0);
          }
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to follow/unfollow user');
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to follow/unfollow user. Please try again.');
    }
  };

  const handleRemoveFollower = async (targetUserId) => {
    if (!currentUserId) {
      toast.error('Please log in');
      return;
    }

    try {
      // Remove follower by unfollowing them (they unfollow you)
      const response = await fetch(`${API_BASE_URL}/users/follow/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: targetUserId })
      });

      if (response.ok) {
        setFollowers(followers.filter(user => user.id !== targetUserId));
        // Refresh user info to get updated counts
        await fetchUserInfo();
        toast.success('Follower removed successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to remove follower');
      }
    } catch (error) {
      console.error('Error removing follower:', error);
      toast.error('Failed to remove follower. Please try again.');
    }
  };

  const handleUnfollow = async (targetUserId) => {
    if (!currentUserId) {
      toast.error('Please log in');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/follow/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: currentUserId })
      });

      if (response.ok) {
        setFollowing(following.filter(user => user.id !== targetUserId));
        // Refresh user info to get updated counts
        await fetchUserInfo();
        toast.success('Unfollowed successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to unfollow user');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user. Please try again.');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Update URL when tab changes
    const profilePath = userId ? `/profile/${userId}` : '/profile';
    if (tab === 'followers') {
      navigate(`${profilePath}/followers`, { replace: true });
    } else {
      navigate(`${profilePath}/following`, { replace: true });
    }
  };
  
  // Get profile link
  const getProfileLink = () => {
    if (userId) return `/profile/${userId}`;
    return '/profile';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!targetUserId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Please log in to view followers/following</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        
        {/* Header */}
        <div className="mb-6">
          <Link to={getProfileLink()} className="inline-block">
            <button
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Profile
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{userName}</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => handleTabChange('followers')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'followers'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Followers ({followersCount})
              </button>
              <button
                onClick={() => handleTabChange('following')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'following'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Following ({followingCount})
              </button>
            </div>
          </div>

          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div className="p-6">
              {followers.length > 0 ? (
                <div className="space-y-4">
                  {followers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                      <Link to={`/profile/${user.id}`} className="flex items-center space-x-4 flex-1">
                        <img
                          src={user.profileImage || '/Profileimages/User.jpg'}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; }}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-gray-600">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">{user.username}</p>
                        </div>
                      </Link>

                      <div className="flex gap-2">
                        {isOwnProfile ? (
                          // Own profile: Show Remove button
                          <button
                            onClick={() => handleRemoveFollower(user.id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        ) : (
                          // Other's profile: Show Follow/Following button
                          <button
                            onClick={() => handleFollowToggle(user.id, 'followers')}
                            className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${
                              user.isFollowing
                                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                : 'bg-black text-white hover:bg-gray-800'
                            }`}
                          >
                            {user.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No followers yet</p>
                </div>
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div className="p-6">
              {following.length > 0 ? (
                <div className="space-y-4">
                  {following.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                      <Link to={`/profile/${user.id}`} className="flex items-center space-x-4 flex-1">
                        <img
                          src={user.profileImage || '/Profileimages/User.jpg'}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; }}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-gray-600">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">{user.username}</p>
                        </div>
                      </Link>

                      <div className="flex gap-2">
                        {isOwnProfile ? (
                          // Own profile: Show Unfollow button
                          <button
                            onClick={() => handleUnfollow(user.id)}
                            className="px-6 py-2 text-sm font-medium bg-gray-200 text-gray-900 rounded-full hover:bg-gray-300 transition-colors"
                          >
                            Unfollow
                          </button>
                        ) : (
                          // Other's profile: Show Follow/Following button
                          <button
                            onClick={() => handleFollowToggle(user.id, 'following')}
                            className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${
                              user.isFollowing
                                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                : 'bg-black text-white hover:bg-gray-800'
                            }`}
                          >
                            {user.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserMinus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Not following anyone yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}