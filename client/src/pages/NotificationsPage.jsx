import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
  const { user } = useAuth();
  const token = user?.token;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setErr('');

        const res = await fetch('http://localhost:5500/notifications', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        // 🔹 Do NOT throw here – treat bad status as "no notifications" for now
        let data = [];
        try {
          data = await res.json();
        } catch {
          data = [];
        }

        if (!res.ok) {
          console.error('Failed to load notifications, status:', res.status, data);
          // Treat as empty list in the UI
          setNotifications([]);
          return;
        }

        // 🔹 If OK, store the array (or empty)
        setNotifications(Array.isArray(data) ? data : []);
        setErr('');
      } catch (error) {
        console.error(error);
        // 🔹 Only in real network error we show the red error message
        setErr('Failed to load notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  if (!token) {
    return <div className="p-4">Please sign in to see notifications.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>

      {loading && <p className="text-gray-500">Loading...</p>}

      {/* 🔹 Only show this if there was a real fetch error */}
      {err && <p className="text-red-500 text-sm">{err}</p>}

      {/* 🔹 If no error and list is empty → friendly message */}
      {!loading && !err && notifications.length === 0 && (
        <p className="text-gray-500">No notifications yet.</p>
      )}

      <ul className="space-y-3">
        {notifications.map((n) => (
          <li
            key={n._id}
            className="border border-gray-200 rounded-lg p-3 text-sm bg-white"
          >
            <p className="text-gray-900">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;
