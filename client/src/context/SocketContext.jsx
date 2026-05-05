import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getApiBaseUrl } from '../config.js';

const SocketContext = createContext({ socket: null, connected: false });

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    if (socketRef.current) {
      return;
    }

    const socket = io(getApiBaseUrl(), {
      auth: {
        token: user.token,
      },
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection failed:', error);
    });

    socket.on('dm:new', (payload) => {
      window.dispatchEvent(new CustomEvent('dm:new', { detail: payload }));
    });

    socket.on('dm:conversation:update', (payload) => {
      window.dispatchEvent(new CustomEvent('dm:conversation:update', { detail: payload }));
    });

    socket.on('dm:unreadCount', (payload) => {
      window.dispatchEvent(new CustomEvent('dm:unreadCount', { detail: payload }));
      window.dispatchEvent(new Event('directMessagesUpdated'));
    });

    socket.on('dm:read', (payload) => {
      window.dispatchEvent(new CustomEvent('dm:read', { detail: payload }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user?.token]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
    }),
    [connected]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
