import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';


const NotificationsPage = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [notifications, setNotifications] = useState([]); //list of notifications
  const [loading, setLoading] = useState(false);//show loading spinner or message
  const [err, setErr] = useState(''); //display error messages

  useEffect(() => {
    if (!token) return; // If user not logged in don’t fetch anything

    //function to fetch notifications from backend
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setErr('');
        //API request to get this user notifications
        const res = await fetch('http://localhost:5500/notifications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, //Sending token for authentication
          },
          credentials: 'include',
        });

        //parsing response with JSON 
        let data = [];
        try {
          data = await res.json();
        } catch {
          data = [];
        }

        //If response fail exist
        if (!res.ok) {
          console.error('Failed to load notifications, status:', res.status, data);
          setNotifications([]);
          return;
        }
        
        //If response is valid then store notifications in state
        setNotifications(Array.isArray(data) ? data : []);
        setErr('');

        // After successfully loading notifications, mark them as read in the backend
        try {
          await fetch('http://localhost:5500/notifications/mark_read', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          });

          // Telling Navbar notification is read
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

    fetchNotifications();
  }, [token]); //Rerun when token changes

  if (!token) {
    return <div className="p-4">Please sign in to see notifications.</div>;
  }

  //Notification page Interface
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
          <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n._id}
              className="border border-gray-200 rounded-lg p-3 text-sm bg-white"
            >
              {/* Main notification message */}
              <p className="text-gray-900">{n.message}</p>

              {/*  Post preview  */}
              {n.post && (
                <div className="flex items-center gap-3 flex-row-reverse 
                mt-2 group cursor-default">
          
            {/* Preview image */}
            {n.post?.image && (
              <img
                src={n.post.image}
                alt="Post preview"
                className="w-16 h-16 object-cover rounded-md border"
              />
            )}

            <div className="flex-1">
              {/* Preview text */}
              {n.post?.text && (
                <p className="text-gray-600 text-xs line-clamp-2">
                  {n.post.text}
                </p>
              )}

            </div>
        </div>
              )}
              {/* Timestamp */}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>

        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;
