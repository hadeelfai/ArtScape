import { Heart, Edit2, Trash, MessageCircle, Flag } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";
import CommentsSection from "./CommentsSection";
import { getCommentCount } from "../api/comments";
import { format } from "timeago.js";
import { Link } from "react-router-dom";

function PostFeeds({ refreshKey, onStartEditing, activeTab, focusPostId }) {
  // All posts currently shown in the feed
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Show/hide comments per post id
  const [showComments, setShowComments] = useState({});

  // Number of comments for each post
  const [commentCounts, setCommentCounts] = useState({});

  // Logged-in user (with token + following info)
  const [loggedInUser, setLoggedInUser] = useState(null);
  const loggedInUserId = loggedInUser?._id?.toString();

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState("");

  // Load logged-in user (full data) from backend
  const loadLoggedInUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem("artscape:user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user) return;

      const res = await fetch(
        `http://localhost:5500/users/${user._id || user.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch user data");
      const fullUser = await res.json();

      setLoggedInUser({ ...fullUser, token: user.token });

      // Keep following array also in localStorage for other parts of the app
      localStorage.setItem(
        "artscape:user",
        JSON.stringify({
          ...user,
          followingArray: fullUser.followingArray,
        })
      );
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Load posts + comment counts from backend
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await fetch("http://localhost:5500/posts", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Filter posts for "Following" tab
      let filtered = data;
      if (activeTab === "following" && loggedInUser) {
        const followingIds = (loggedInUser.followingArray || []).map((id) =>
          id.toString()
        );
        filtered = data.filter(
          (post) =>
            post.user &&
            followingIds.includes(post.user._id?.toString() || "")
        );
      }

      // Mark if the current user liked each post
      const updatedPosts = filtered.map((post) => ({
        ...post,
        isLikedByUser: loggedInUser
          ? post.likes.some((u) => u._id === loggedInUser._id)
          : false,
      }));

      setPosts(updatedPosts);

      // Fetch comment counts for each post
      const counts = {};
      await Promise.all(
        updatedPosts.map(async (post) => {
          try {
            const count = await getCommentCount(post._id);
            counts[post._id] = count;
          } catch (error) {
            console.error("Failed to load comment count", error);
          }
        })
      );
      setCommentCounts(counts);
    } catch (error) {
      console.error(error);
      setErr("Error while loading posts");
    } finally {
      setLoading(false);
    }
  }, [activeTab, loggedInUser]);

  // Initial: load user
  useEffect(() => {
    loadLoggedInUser();
  }, [loadLoggedInUser]);

  // Load posts when:
  // - user is loaded / changes
  // - tab changes
  // - refreshKey changes
  useEffect(() => {
    loadPosts();
  }, [loadPosts, refreshKey]);

  // Scroll to focused post when loaded (e.g. from notification click)
  useEffect(() => {
    if (!focusPostId || !posts.length) return;
    const el = document.getElementById(`post-${focusPostId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusPostId, posts]);

  // Toggle comment section for a post
  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Like / unlike a post (server is the source of truth)
  const handleLike = async (postId, isCurrentlyLiked) => {
    const token = loggedInUser?.token;
    if (!token) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5500/posts/like/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json(); // { id, liked, likesCount }

      // Update only this post using values from backend
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: Array(data.likesCount).fill(null),
                isLikedByUser: data.liked,
              }
            : post
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update like");
      // fallback to reloading from server if something went wrong
      loadPosts();
    }
  };

  // Delete a post (only owner)
  const handleDeletePost = async (postId) => {
    const token = loggedInUser?.token;
    if (!token) {
      toast.error("Please sign in");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5500/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete post");
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success("Post deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete post");
    }
  };

  // Send report to backend (email goes to admin from backend)
  const handleReportPost = async (postId, reason, details = "") => {
    const token = loggedInUser?.token;
    if (!token) {
      toast.error("Please sign in");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5500/posts/${postId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason, details }),
        }
      );

      if (!res.ok) throw new Error("Failed to report post");
      toast.success("Post reported. Thank you for your feedback.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to report post");
    }
  };

    // Block Following tab if user not logged in
    if (activeTab === "following" && !loggedInUser) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <p className="mb-4">You must be signed in to view the Following feed.</p>
          <button
            className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800"
            onClick={() => window.location.href = "/login"}
          >
            Sign In
          </button>
        </div>
      );
    }

  // Let parent open edit UI
  const handleEditClick = (post) => {
    if (onStartEditing) onStartEditing(post);
  };

  // Loading / error UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-10 h-10 border-t-primary border-4 border-gray-300 rounded-full animate-spin" />
      </div>
    );
  }

  if (err) {
    return <div className="p-4 text-sm text-red-600">{err}</div>;
  }

  if (!posts.length) {
    return (
      <div className="text-gray-500 flex items-center justify-center">
        No posts yet...
      </div>
    );
  }

  return (
    <div>
      {posts
        .filter((post) => post.user)
        .map((post) => (
          <article
            id={`post-${post._id}`}
            key={post._id}
            className={`border-b border-gray-200 p-4 flex gap-3 ${focusPostId === post._id ? "ring-2 ring-black ring-inset rounded-lg" : ""}`}
          >
            {/* Avatar */}
            <img
              src={post?.user?.profileImage || "/assets/images/profilepicture.jpg"}
              alt={`${post?.user?.name}'s profile`}
              className="h-10 w-10 rounded-full object-cover"
              onError={(e) => {
                if (e.target.src.includes('cloudinary')) {
                  const separator = e.target.src.includes('?') ? '&' : '?';
                  e.target.src = `${e.target.src}${separator}_v=${Date.now()}`;
                } else {
                  e.target.src = '/assets/images/profilepicture.jpg';
                }
              }}
            />

            <div className="flex-1">
              {/* User name + username + time */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/profile/${post?.user?._id}`}
                  className="font-medium hover:underline"
                >
                  {post?.user?.name}
                </Link>
                {post?.user?.username && (
                  <p className="text-sm text-gray-500 mt-1">
                    @{post.user.username}
                  </p>
                )}
                <span className="text-gray-400 text-sm">
                  {format(post?.createdAt)}
                </span>
              </div>

              {/* Text */}
              <p className="mt-2 whitespace-pre-wrap">{post?.text}</p>

              {/* Image */}
              {post?.image && (
                <img
                  src={post?.image}
                  className="mt-3 rounded-2xl max-h-[600px] w-full object-cover"
                  loading="lazy"
                />
              )}

              {/* Actions row */}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                {/* Like */}
                <button
                  type="button"
                  className="flex items-center gap-2 hover:text-red"
                  onClick={() => handleLike(post._id, post.isLikedByUser)}
                >
                  <Heart
                    className={
                      post?.isLikedByUser
                        ? "fill-red-500 text-red-500"
                        : "text-gray-500"
                    }
                  />
                  <span
                    className={
                      post?.isLikedByUser
                        ? "fill-red-500 text-red-500"
                        : "text-gray-500"
                    }
                  >
                    {Array.isArray(post.likes) ? post.likes.length : 0}
                  </span>
                </button>

                {/* Comments */}
                <button
                  onClick={() => toggleComments(post._id)}
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  <MessageCircle
                    className={showComments[post._id] ? "text-black" : ""}
                  />
                  <span
                    className={showComments[post._id] ? "text-black" : ""}
                  >
                    {commentCounts[post._id] || 0}
                  </span>
                </button>

                {/* Right side: owner gets edit/delete, others get report */}
                {post.user?._id?.toString() === loggedInUserId?.toString() ? (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(post)}
                      className="text-gray-500 hover:text-black"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="text-gray-500 hover:text-red-700"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setReportPostId(post._id);
                      setReportReason("");
                      setReportDetails("");
                      setReportError("");
                      setIsReportModalOpen(true);
                    }}
                    className="ml-auto text-gray-500 hover:text-yellow-600"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Comments for this post */}
              <CommentsSection
                postId={post._id}
                showComments={showComments[post._id] || false}
                commentsCount={commentCounts[post._id] || 0}
                onCountChange={(count) =>
                  setCommentCounts((prev) => ({
                    ...prev,
                    [post._id]: count,
                  }))
                }
              />
            </div>
          </article>
        ))}

      {/* Report modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Report Post</h2>

            {/* Reason options */}
            <div className="space-y-2 mb-4">
              {[
                "Spam",
                "Harassment",
                "Inappropriate content",
                "Copyright violation",
                "Other",
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => {
                      setReportReason(e.target.value);
                      setReportError("");
                    }}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {/* Additional details (optional) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional details (optional)
              </label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {reportError && (
              <p className="mb-3 text-xs text-red-500">{reportError}</p>
            )}

            {/* Modal buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false);
                  setReportPostId(null);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!reportReason) {
                    setReportError("Please select a reason");
                    return;
                  }
                  await handleReportPost(
                    reportPostId,
                    reportReason,
                    reportDetails
                  );
                  setIsReportModalOpen(false);
                  setReportPostId(null);
                  setReportReason("");
                  setReportDetails("");
                }}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostFeeds;
