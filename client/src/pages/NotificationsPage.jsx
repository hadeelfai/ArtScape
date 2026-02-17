import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { getApiBaseUrl } from '../config.js';

const NotificationsPage = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErr('');
      const res = await fetch(`${getApiBaseUrl()}/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      let data = [];
      try {
        data = await res.json();
      } catch {
        data = [];
      }

      if (!res.ok) {
        setNotifications([]);
        return;
      }

      setNotifications(Array.isArray(data) ? data : []);
      setErr('');

      try {
        await fetch(`${getApiBaseUrl()}/notifications/mark_read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
        window.dispatchEvent(new Event('notificationsRead'));
      } catch (readMarkError) {
        console.error('Failed to mark notifications as read:', readMarkError);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setErr('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleDeleteNotification = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
        toast.success('Notification removed');
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationLink = (n) => {
    const postId = n.post?._id || n.post;
    const fromUserId = n.fromUser?._id || n.fromUser;
    if (postId) {
      return `/CommunityPage?post=${postId}`;
    }
    if (fromUserId) {
      return `/profile/${fromUserId}`;
    }
    return '/CommunityPage';
  };

  if (!token) {
    return <div className="p-4">Please sign in to see notifications.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>

      {loading && <p className="text-gray-500">Loading...</p>}

      {err && !loading && (
        <p className="text-red-500 text-sm">{err}</p>
      )}

      {!loading && !err && notifications.length === 0 && (
        <p className="text-gray-500">No notifications yet.</p>
      )}

      <ul className="space-y-3">
        {notifications.map((n) => (
          <li key={n._id} className="border border-gray-200 rounded-lg overflow-hidden bg-white group hover:border-gray-300 transition">
            <Link
              to={getNotificationLink(n)}
              className="block p-3 text-sm hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">{n.message}</p>

                  {n.post && (
                    <div className="flex items-center gap-3 flex-row-reverse mt-2">
                      {n.post?.image && (
                        <img
                          src={n.post.image}
                          alt="Post preview"
                          className="w-16 h-16 object-cover rounded-md border shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        {n.post?.text && (
                          <p className="text-gray-600 text-xs line-clamp-2">
                            {n.post.text}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDeleteNotification(e, n._id)}
                  className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;
