import { Heart, Edit2, Trash, MessageCircle, Flag } from 'lucide-react';
import React, { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
import CommentsSection from './CommentsSection';
import { getCommentCount } from '../api/comments';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';

function PostFeeds({ refreshKey, onStartEditing, activeTab }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showComments, setShowComments] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [optimisticPosts, setOptimisticPosts] = useOptimistic(posts, (state, { postId, liked, likesCount }) =>
    state.map(post =>
      post._id === postId
        ? { ...post, likes: Array(likesCount).fill(null), isLikedByUser: liked }
        : post
    )
  );
  const [isPending, startTransition] = useTransition();
  const [loggedInUser, setLoggedInUser] = useState(null);

  const loggedInUserId = loggedInUser?._id?.toString();

  // ---------------- Load logged-in user ----------------
  const loadLoggedInUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem('artscape:user');
      const user = stored ? JSON.parse(stored) : null;
      if (!user) return;

      const res = await fetch(`http://localhost:5500/users/${user._id || user.id}`);
      if (!res.ok) throw new Error('Failed to fetch user data');
      const fullUser = await res.json();

      setLoggedInUser({ ...fullUser, token: user.token });
      localStorage.setItem(
        'artscape:user',
        JSON.stringify({ ...user, followingArray: fullUser.followingArray })
      );
    } catch (error) {
      console.error(error);
    }
  }, []);

  // ---------------- Load posts ----------------
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setErr('');

      const res = await fetch('http://localhost:5500/posts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Filter posts for "following" tab
      let filteredPosts = data;
      if (activeTab === 'following') {
        const followingIds = (loggedInUser?.followingArray || []).map(id => id.toString());
        filteredPosts = data.filter(post => post.user && followingIds.includes(post.user._id.toString()));
      }

      // Compute isLikedByUser for each post
      const updatedPosts = filteredPosts.map(post => ({
        ...post,
        isLikedByUser: post.likes.some(u => u._id === loggedInUser?._id)
      }));

      setPosts(updatedPosts);
      startTransition(() => setOptimisticPosts(updatedPosts));

      // Load comment counts
      const counts = {};
      await Promise.all(
        updatedPosts.map(async post => {
          try {
            counts[post._id] = await getCommentCount(post._id);
          } catch (error) {
            console.error('Failed to load comment count', error);
          }
        })
      );
      setCommentCounts(counts);
    } catch (error) {
      console.error(error);
      setErr('Error while loading posts');
    } finally {
      setLoading(false);
    }
  }, [activeTab, loggedInUser]);

  useEffect(() => {
    loadLoggedInUser();
  }, [loadLoggedInUser]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts, refreshKey, loggedInUser]);

  // ---------------- Actions ----------------
  const toggleComments = postId =>
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));

  const handleLike = async (postId, currentLikesCount, isCurrentlyLiked) => {
    const token = loggedInUser?.token;
    if (!token) return;

    const newLiked = !isCurrentlyLiked;
    const newLikesCount = newLiked ? currentLikesCount + 1 : currentLikesCount - 1;

    // Optimistic update
    setOptimisticPosts(prev =>
      prev.map(post =>
        post._id === postId
          ? { ...post, isLikedByUser: newLiked, likes: Array(newLikesCount).fill(null) }
          : post
      )
    );

    try {
      const res = await fetch(`http://localhost:5500/posts/like/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Sync with server response
      setPosts(prev =>
        prev.map(post =>
          post._id === postId
            ? { ...post, likes: Array(data.likesCount).fill(null), isLikedByUser: data.liked }
            : post
        )
      );
    } catch (error) {
      toast.error('Failed to update like');
      loadPosts();
    }
  };

  const handleDeletePost = async postId => {
    const token = loggedInUser?.token;
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5500/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete post');
    }
  };

  const handleReportPost = async postId => {
    const token = loggedInUser?.token;
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5500/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: 'Inappropriate content' })
      });
      if (!res.ok) throw new Error('Failed to report post');
      toast.success('Post reported');
    } catch (error) {
      console.error(error);
      toast.error('Failed to report post');
    }
  };

  const handleEditClick = post => {
    if (onStartEditing) onStartEditing(post);
  };

  // ---------------- Render ----------------
  if (loading)
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-10 h-10 border-t-primary border-4 border-gray-300 rounded-full animate-spin"></div>
      </div>
    );

  if (err) return <div className="p-4 text-sm text-red-600">{err}</div>;
  if (!optimisticPosts.length)
    return <div className="text-gray-500 flex items-center justify-center">No posts yet...</div>;

  return (
    <div>
      {optimisticPosts
        .filter(post => post.user)
        .map(post => (
          <article key={post._id} className="border-b border-gray-200 p-4 flex gap-3">
            <img
              src={post?.user?.profileImage || '/avatar.png'}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${post?.user?._id}`} className="font-medium hover:underline">
                  {post?.user?.name}
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  @{post?.user?.username || post?.user?.name.toLowerCase().replace(/\s+/g, '_')}
                </p>
                <span className="text-gray-400 text-sm">{format(post?.createdAt)}</span>
              </div>

              <p className="mt-2 whitespace-pre-wrap">{post?.text}</p>

              {post?.image && (
                <img
                  src={post?.image}
                  className="mt-3 rounded-2xl max-h-[600px] w-full object-cover"
                  loading="lazy"
                />
              )}

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <button
                  type="button"
                  className="flex items-center gap-2 hover:text-red"
                  disabled={isPending}
                  onClick={() =>
                    handleLike(
                      post._id,
                      Array.isArray(post.likes) ? post.likes.length : 0,
                      post.isLikedByUser
                    )
                  }
                >
                  <Heart className={post?.isLikedByUser ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
                  <span className={post?.isLikedByUser ? 'fill-red-500 text-red-500' : 'text-gray-500'}>
                    {Array.isArray(post.likes) ? post.likes.length : 0}
                  </span>
                </button>

                <button
                  onClick={() => toggleComments(post._id)}
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  <MessageCircle className={showComments[post._id] ? 'text-black' : ''} />
                  <span className={showComments[post._id] ? 'text-black' : ''}>
                    {commentCounts[post._id] || 0}
                  </span>
                </button>

                {/* Edit/Delete for own posts */}
                {post.user?._id?.toString() === loggedInUserId?.toString() && (
                  <div className="mt-3 flex items-center gap-2 ml-auto">
                    <button onClick={() => handleEditClick(post)} className="text-gray-500 hover:text-black">
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="text-gray-500 hover:text-red-700"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Report for other posts */}
                {post.user?._id?.toString() !== loggedInUserId?.toString() && (
                  <button
                    onClick={() => handleReportPost(post._id)}
                    className="ml-auto text-gray-500 hover:text-yellow-600"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                )}
              </div>

              <CommentsSection
                postId={post._id}
                showComments={showComments[post._id] || false}
                commentsCount={commentCounts[post._id] || 0}
                onCountChange={count => setCommentCounts(prev => ({ ...prev, [post._id]: count }))}
              />
            </div>
          </article>
        ))}
    </div>
  );
}

export default PostFeeds;
