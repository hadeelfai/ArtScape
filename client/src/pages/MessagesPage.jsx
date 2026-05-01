import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../config.js';
import { toast } from 'sonner';

const DEFAULT_AVATAR = '/Profileimages/User.jpg';

const MessagesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConversationList, setShowConversationList] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const messagesEndRef = useRef(null);

  const authHeaders = {
    'Authorization': `Bearer ${user?.token}`,
  };

  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) navigate('/signin');
  }, [isAuthenticated, navigate]);

  // ─── Mobile detection ─────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadConversations = async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/messages/conversations`, {
        credentials: 'include',
        headers: authHeaders,
      });

      if (!res.ok) throw new Error('Failed to load conversations');

      const { conversations: data = [] } = await res.json();
      setConversations(data);

      const targetUserId = searchParams.get('user');
      if (!targetUserId) return;

      const existing = data.find(c => c.participantId === targetUserId);
      if (existing) {
        setActiveConversation(existing);
        return;
      }

      let participantName = 'Unknown User';
      let participantAvatar = DEFAULT_AVATAR;

      try {
        const userRes = await fetch(`${getApiBaseUrl()}/users/profile/${targetUserId}`, {
          credentials: 'include',
        });
        if (userRes.ok) {
          const { user: userData } = await userRes.json();
          participantName = userData?.name || participantName;
          participantAvatar = userData?.profileImage || participantAvatar;
        }
      } catch {
        // Silently fall back to defaults
      }

      setActiveConversation({
        conversationId: null,
        participantId: targetUserId,
        participantName,
        participantAvatar,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        isNew: true,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load conversations');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadConversations();
  }, [user?.id, user?.token, searchParams]);

  const fetchUserSearchResults = async (query) => {
    const normalized = query.trim();
    if (!normalized) {
      setUserResults([]);
      setUserSearchError('');
      return;
    }

    setIsSearchingUsers(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/users?username=${encodeURIComponent(normalized)}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to search users');

      const results = await res.json();
      const filtered = Array.isArray(results)
        ? results.filter(u => u._id !== user?.id && u.id !== user?.id)
        : [];

      setUserResults(filtered);
      setUserSearchError('');
    } catch (err) {
      console.error(err);
      setUserResults([]);
      setUserSearchError('Unable to search users');
    } finally {
      setIsSearchingUsers(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setUserResults([]);
      setUserSearchError('');
      return;
    }

    const timeout = setTimeout(() => {
      fetchUserSearchResults(searchTerm);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchTerm, user?.id]);

  // ─── Load messages for active conversation ────────────────────────────────
  useEffect(() => {
    if (!activeConversation) return;
    if (activeConversation.isNew) { setMessages([]); return; }
    if (!activeConversation.conversationId) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/messages/${activeConversation.conversationId}`,
          { credentials: 'include', headers: authHeaders }
        );
        if (!res.ok) throw new Error();
        const { messages: data = [] } = await res.json();
        setMessages(data);

        setConversations(prev => prev.map(c =>
          c.conversationId === activeConversation.conversationId
            ? { ...c, unreadCount: 0 }
            : c
        ));

        loadConversations(false);
        window.dispatchEvent(new Event('directMessagesUpdated'));
      } catch {
        toast.error('Failed to load messages');
      }
    };

    loadMessages();
  }, [activeConversation?.conversationId, user?.token]);

  // ─── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/messages/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ recipientId: activeConversation.participantId, content }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      const newMessage = {
        _id: data.message._id,
        sender: { _id: user.id, name: user.name || '', profileImage: user.profileImage || '' },
        recipient: activeConversation.participantId,
        content,
        createdAt: new Date().toISOString(),
        read: false,
      };

      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      toast.success('Message sent');

      if (activeConversation.conversationId) {
        setConversations(prev =>
          prev.map(c =>
            c.conversationId === activeConversation.conversationId
              ? { ...c, lastMessage: content, lastMessageTime: newMessage.createdAt }
              : c
          )
        );
      } else {
        const newConv = {
          conversationId: data.conversationId,
          participantId: activeConversation.participantId,
          participantName: activeConversation.participantName,
          participantAvatar: activeConversation.participantAvatar,
          lastMessage: content,
          lastMessageTime: newMessage.createdAt,
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversation(prev => ({ ...prev, conversationId: data.conversationId, isNew: false }));
      }
    } catch {
      toast.error('Failed to send message');
    }
  };

  // ─── Delete conversation ──────────────────────────────────────────────────
  const handleDeleteConversation = async () => {
    const { conversationId } = deleteTarget;
    if (!conversationId) {
      toast.error('Cannot delete this conversation');
      setDeleteTarget(null);
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/messages/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders,
      });

      if (!res.ok) throw new Error();

      setConversations(prev => prev.filter(c => c.conversationId !== conversationId));
      if (activeConversation?.conversationId === conversationId) setActiveConversation(null);
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete conversation');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === yesterday.toDateString())
      return 'Yesterday';
    if (date.getFullYear() === now.getFullYear())
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const filteredConversations = conversations.filter(c =>
    (c.participantName || c.participantId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openUserConversation = (selectedUser) => {
    const participantId = selectedUser._id || selectedUser.id;
    const existing = conversations.find(c => c.participantId === participantId);

    if (existing) {
      setActiveConversation(existing);
    } else {
      setActiveConversation({
        conversationId: null,
        participantId,
        participantName: selectedUser.name || selectedUser.username || 'User',
        participantAvatar: selectedUser.profileImage || DEFAULT_AVATAR,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        isNew: true,
      });
    }

    setSearchTerm('');
    setUserResults([]);
    if (isMobile) setShowConversationList(false);
  };

  const openConversation = (conv) => {
    setActiveConversation(conv);
    if (isMobile) setShowConversationList(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 top-20 w-full bg-white overflow-hidden flex flex-col md:flex-row">

        {/* Sidebar */}
        {(!isMobile || showConversationList) && (
          <div className={`${isMobile ? 'w-full' : 'w-96'} h-full border-r border-gray-200 flex flex-col`}>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations or users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-4 text-center text-gray-500">Loading conversations...</p>
              ) : (
                <>
                  {/* Conversations */}
                  {filteredConversations.length > 0 && (
                    <div className="mb-4">
                      <h3 className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                        Conversations
                      </h3>
                      {filteredConversations.map(conv => (
                        <button
                          key={conv.conversationId || conv.participantId}
                          onClick={() => openConversation(conv)}
                          className={`group w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left flex items-center justify-between ${
                            activeConversation?.participantId === conv.participantId
                              ? 'bg-gray-50 border-l-2 border-l-black'
                              : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <img
                              src={conv.participantAvatar || DEFAULT_AVATAR}
                              alt={conv.participantName}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {conv.participantName || 'Unknown User'}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">
                                {conv.lastMessage || 'No messages yet'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 text-right">
                              <span className="text-xs text-gray-500">
                                {formatTime(conv.lastMessageTime)}
                              </span>
                              {conv.unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 text-[10px] font-semibold text-white bg-red-500 rounded-full">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteTarget(conv); }}
                            className="ml-2 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Users */}
                  {searchTerm.trim().length >= 2 && (
                    <div>
                      <h3 className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                        People
                      </h3>
                      {isSearchingUsers ? (
                        <p className="p-4 text-sm text-gray-500">Searching users...</p>
                      ) : userSearchError ? (
                        <p className="p-4 text-sm text-red-500">{userSearchError}</p>
                      ) : userResults.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">No users found.</p>
                      ) : (
                        userResults.map(result => (
                          <button
                            key={result._id || result.id}
                            type="button"
                            onClick={() => openUserConversation(result)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={result.profileImage || DEFAULT_AVATAR}
                                alt={result.name || result.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{result.name || 'Unknown User'}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {result.username ? `@${result.username.replace(/^@+/, '')}` : 'No username'}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* No results */}
                  {filteredConversations.length === 0 && (!searchTerm.trim() || searchTerm.trim().length < 2) && (
                    <p className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No conversations found' : 'No messages yet. Start a conversation!'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Chat area */}
        {activeConversation && (!isMobile || !showConversationList) && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'} h-full flex flex-col bg-white`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveConversation(null);
                  if (isMobile) setShowConversationList(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <img
                src={activeConversation.participantAvatar || DEFAULT_AVATAR}
                alt={activeConversation.participantName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <h3 className="font-semibold text-gray-900">
                {activeConversation.participantName || 'User'}
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col justify-end">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
              ) : (
                messages.map(msg => {
                  const isSent = (msg.sender?._id ?? msg.sender) === user.id;
                  return (
                    <div
                      key={msg._id || `${msg.createdAt}-${msg.content}`}
                      className={`flex flex-col gap-1 ${isSent ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm break-words ${
                        isSent
                          ? 'bg-black text-white rounded-br-none shadow-sm'
                          : 'bg-gray-200 text-gray-900 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${isSent ? 'flex-row-reverse pr-2' : 'pl-2'}`}>
                        <span className="text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isSent && (
                          <span className="text-gray-500 font-medium">
                            {msg.read ? '✓✓ Read' : '✓ Delivered'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Empty state (desktop only) */}
        {!activeConversation && !isMobile && (
          <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-600">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Delete Conversation?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your conversation with{' '}
              <span className="font-medium">{deleteTarget.participantName}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagesPage;
