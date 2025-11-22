import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);

  // Fetch user profile info
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!targetUserId) {
        setIsLoading(false);
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
    };

    fetchUserInfo();
  }, [targetUserId]);

  // Fetch followers/following data
  useEffect(() => {
    const fetchData = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch followers
        const followersResponse = await fetch(`${API_BASE_URL}/users/profile/${targetUserId}/followers`, {
          credentials: 'include'
        });
        
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          setFollowers(followersData.followers || []);
          setFollowersCount(followersData.count || 0);
        }

        // Fetch following
        const followingResponse = await fetch(`${API_BASE_URL}/users/profile/${targetUserId}/following`, {
          credentials: 'include'
        });
        
        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          setFollowing(followingData.following || []);
          setFollowingCount(followingData.count || 0);
        }
      } catch (error) {
        console.error('Error fetching followers/following:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [targetUserId]);

  const handleFollowToggle = (targetUserId, listType) => {
    if (listType === 'followers') {
      setFollowers(followers.map(user => 
        user.id === targetUserId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      ));
    } else {
      setFollowing(following.map(user => 
        user.id === targetUserId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      ));
    }
    // TODO: Call API to follow/unfollow user
  };

  const handleRemoveFollower = (targetUserId) => {
    setFollowers(followers.filter(user => user.id !== targetUserId));
    // TODO: Call API to remove follower
    alert('Follower removed');
  };

  const handleUnfollow = (targetUserId) => {
    setFollowing(following.filter(user => user.id !== targetUserId));
    // TODO: Call API to unfollow user
    alert('Unfollowed user');
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

  const isOwnProfile = userId === currentUserId || (!userId && currentUserId);
  
  // Get profile link
  const getProfileLink = () => {
    if (userId) return `/profile/${userId}`;
    return '/profile';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
                          src={user.profileImage}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-gray-600">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">{user.username}</p>
                          <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
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
                          src={user.profileImage}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-gray-600">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">{user.username}</p>
                          <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
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