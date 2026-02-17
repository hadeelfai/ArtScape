import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { toast } from 'sonner';

import { getApiBaseUrl } from '../config.js';

export default function FollowersFollowingPage() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  
  const getDefaultTab = () => {
    return location.pathname.includes('/following') ? 'following' : 'followers';
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

  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);

  const fetchUserInfo = useCallback(async () => {
    if (!targetUserId) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/profile/${targetUserId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUserName(data.user.name || 'User');
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    const fetchData = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        setFollowers([]);
        setFollowing([]);
        return;
      }

      const userIdString = String(targetUserId);

      try {
        setIsLoading(true);
        
        let currentUserFollowing = [];
        if (currentUserId) {
          try {
            const currentUserResponse = await fetch(`${getApiBaseUrl()}/users/profile/${String(currentUserId)}/following`, {
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
        
        const followersResponse = await fetch(`${getApiBaseUrl()}/users/profile/${userIdString}/followers`, {
          credentials: 'include'
        });
        
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          const followersArray = Array.isArray(followersData.followers) ? followersData.followers : [];
          
          setFollowers(followersArray.map(follower => ({
            ...follower,
            isFollowing: currentUserFollowing.includes(follower.id)
          })));
          
          setFollowersCount(followersData.count ?? followersArray.length);
        }

        const followingResponse = await fetch(`${getApiBaseUrl()}/users/profile/${userIdString}/following`, {
          credentials: 'include'
        });
        
        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          const followingArray = Array.isArray(followingData.following) ? followingData.following : [];
          
          setFollowing(followingArray.map(followed => ({
            ...followed,
            isFollowing: isOwnProfile ? true : currentUserFollowing.includes(followed.id)
          })));
          
          setFollowingCount(followingData.count ?? followingArray.length);
        }
      } catch (error) {
        console.error('Error fetching followers/following:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, currentUserId, isOwnProfile]);

  const handleFollowToggle = async (targetUserToFollowId, listType) => {
    if (!currentUserId) {
      toast.error('Please log in to follow users');
      return;
    }

    try {
      const userList = listType === 'followers' ? followers : following;
      const currentUser = userList.find(u => u.id === targetUserToFollowId);
      const newIsFollowing = !(currentUser?.isFollowing || false);

      const response = await fetch(`${getApiBaseUrl()}/users/follow/${targetUserToFollowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: currentUserId })
      });

      if (response.ok) {
        const updateUser = (user) => 
          user.id === targetUserToFollowId 
            ? { ...user, isFollowing: newIsFollowing }
            : user;

        if (listType === 'followers') {
          setFollowers(followers.map(updateUser));
        } else {
          setFollowing(following.map(updateUser));
        }

        toast.success(newIsFollowing ? 'Followed successfully' : 'Unfollowed successfully');
        await fetchUserInfo();
        
        const profileOwnerId = userId || currentUserId;
        if (targetUserToFollowId === profileOwnerId) {
          const [followersRes, followingRes] = await Promise.all([
            fetch(`${getApiBaseUrl()}/users/profile/${profileOwnerId}/followers`, { credentials: 'include' }),
            fetch(`${getApiBaseUrl()}/users/profile/${profileOwnerId}/following`, { credentials: 'include' })
          ]);
          
          if (followersRes.ok) {
            const data = await followersRes.json();
            setFollowersCount(data.count ?? 0);
          }
          
          if (followingRes.ok) {
            const data = await followingRes.json();
            setFollowingCount(data.count ?? 0);
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

  const handleRemoveFollower = async (followerToRemoveId) => {
    if (!currentUserId) {
      toast.error('Please log in');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/follow/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: followerToRemoveId })
      });

      if (response.ok) {
        setFollowers(followers.filter(user => user.id !== followerToRemoveId));
        
        const countResponse = await fetch(`${getApiBaseUrl()}/users/profile/${String(targetUserId)}/followers`, {
          credentials: 'include'
        });
        if (countResponse.ok) {
          const data = await countResponse.json();
          setFollowersCount(data.count ?? 0);
        }
        
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

  const handleUnfollow = async (userToUnfollowId) => {
    if (!currentUserId) {
      toast.error('Please log in');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/follow/${userToUnfollowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: currentUserId })
      });

      if (response.ok) {
        setFollowing(following.filter(user => user.id !== userToUnfollowId));
        
        const countResponse = await fetch(`${getApiBaseUrl()}/users/profile/${String(targetUserId)}/following`, {
          credentials: 'include'
        });
        if (countResponse.ok) {
          const data = await countResponse.json();
          setFollowingCount(data.count ?? 0);
        }
        
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
    const profilePath = userId ? `/profile/${userId}` : '/profile';
    navigate(`${profilePath}/${tab}`, { replace: true });
  };
  
  const getProfileLink = () => {
    return userId ? `/profile/${userId}` : '/profile';
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
                          <button
                            onClick={() => handleRemoveFollower(user.id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        ) : user.id === currentUserId ? null : (
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
                          <button
                            onClick={() => handleUnfollow(user.id)}
                            className="px-6 py-2 text-sm font-medium bg-gray-200 text-gray-900 rounded-full hover:bg-gray-300 transition-colors"
                          >
                            Unfollow
                          </button>
                        ) : user.id === currentUserId ? null : (
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