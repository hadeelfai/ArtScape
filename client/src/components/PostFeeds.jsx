import { Heart, Edit2, Trash, MessageCircle, Flag } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import CommentsSection from "./CommentsSection";
import { getCommentCount } from "../api/comments";
import { format } from "timeago.js";
import { Link } from "react-router-dom";

function PostFeeds({ refreshKey, onStartEditing }) {
  // storing list of posts
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // used for smoother UI updates on likes
  const [isPending, startTransition] = useTransition();

  // show/hide comment section for individual posts
  const [showComments, setShowComments] = useState({});

  // storing comment counter for each post
  const [commentCounts, setCommentCounts] = useState({});

  // report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState("");

  // like functionality UI — changes UI first then syncs with backend
  const [optimisticPosts, setOptimisticPosts] = useOptimistic(
    posts,
    (state, { postId, liked, likesCount }) =>
      state.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: Array(likesCount).fill(null),
              isLikedByUser: liked,
            }
          : post
      )
  );

  // Send report to backend
  // backend will trigger nodemailer to send email to admin
  const handleReportPost = async (postId, reason, details = "") => {
    try {
      const token = localStorage.getItem("artscape:user")
        ? JSON.parse(localStorage.getItem("artscape:user")).token
        : null;

      const res = await fetch(
        `http://localhost:5500/posts/${postId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
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

  // edit button click — opens edit UI from parent
  const handleEditClick = (post) => {
    if (onStartEditing) onStartEditing(post);
  };

  // like/unlike post
  const handleLike = async (postId, currentLikesCount, isCurrentlyLiked) => {
    const token = localStorage.getItem("artscape:user")
      ? JSON.parse(localStorage.getItem("artscape:user")).token
      : null;

    const newLiked = !isCurrentlyLiked;
    const newLikesCount = newLiked
      ? currentLikesCount + 1
      : currentLikesCount - 1;

    // optimistic UI — makes like feel instant
    startTransition(async () => {
      setOptimisticPosts({
        postId,
        liked: newLiked,
        likesCount: newLikesCount,
      });

      try {
        const res = await fetch(
          `http://localhost:5500/posts/like/${postId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

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
        toast.error("Failed to update like");
        loadPosts(); // fallback — reload posts to ensure accuracy
      }
    });
  };

  // delete post
  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem("artscape:user")
        ? JSON.parse(localStorage.getItem("artscape:user")).token
        : null;

      const res = await fetch(`http://localhost:5500/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Failed to delete");
      setPosts((prev) => prev.filter((p) => p._id !== postId)); // UI update only
      toast.success("Post deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    }
  };

  // fetch posts + comment counts
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
      setPosts(data);

      // load comment numbers for each post
      const counts = {};
      await Promise.all(
        data.map(async (post) => {
          try {
            const count = await getCommentCount(post?._id);
            counts[post?._id] = count;
          } catch (error) {
            console.error("Failed to load comment count", error);
          }
        })
      );
      setCommentCounts(counts);
    } catch (error) {
      setErr("Error while loading posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts, refreshKey]);

  // comment toggle per post
  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // UI loading and error states
  if (loading)
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-10 h-10 border-t-primary border-4 border-gray-300 rounded-full animate-spin" />
      </div>
    );
  if (err) return <div className="p-4 text-sm text-red-600">{err}</div>;
  if (!optimisticPosts.length)
    return <div className="text-gray-500 flex items-center justify-center">No posts yet...</div>;

  return (
    <div>
      {optimisticPosts?.map((post) => (
        <article key={post._id} className="border-b border-gray-200 p-4 flex gap-3">
          
          {/* Post avatar */}
          <img
            src={post?.user?.avatar || "/avatar.png"}
            className="h-10 w-10 rounded-full object-cover"
          />

          <div className="flex-1">
            
            {/* user & time */}
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${post?.user?._id}`}
                className="font-medium hover:underline"
              >
                {post?.user?.name}
              </Link>
              <span className="text-gray-400 text-sm">{format(post?.createdAt)}</span>
            </div>

            {/* post text */}
            <p className="mt-2 whitespace-prepwrap">{post?.text}</p>

            {/* post image */}
            {post?.image && (
              <img
                src={post?.image}
                className="mt-3 rounded-2xl max-h-[600px] w-full object-cover"
                loading="lazy"
              />
            )}

            {/* post actions */}
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              
              {/* Like btn */}
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
                <Heart
                  className={
                    post?.isLikedByUser ? "fill-red-500 text-red-500" : "text-gray-500"
                  }
                />
                <span
                  className={
                    post?.isLikedByUser ? "fill-red-500 text-red-500" : "text-gray-500"
                  }
                >
                  {Array.isArray(post.likes) ? post.likes.length : 0}
                </span>
              </button>

              {/* show comments */}
              <button
                onClick={() => toggleComments(post?._id)}
                className="flex items-center gap-2 hover:text-black transition-colors"
              >
                <MessageCircle
                  className={showComments[post?._id] ? "text-black" : ""}
                />
                <span
                  className={showComments[post?._id] ? "text-black" : ""}
                >
                  {commentCounts[post?._id] || 0}
                </span>
              </button>

              {/* edit post */}
              <button
                onClick={() => handleEditClick(post)}
                className="text-gray-500 hover:text-black"
              >
                <Edit2 className="h-5 w-5" />
              </button>

              {/* right section */}
              <div className="ml-auto flex items-center gap-2">

                {/* report */}
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

                {/* delete */}
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="ml-auto text-gray-500 hover:text-red-700"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* comments section for that post */}
            <CommentsSection
              postId={post._id}
              showComments={showComments[post?._id] || false}
              commentsCount={commentCounts[post._id] || 0}
              onCountChange={(count) => {
                setCommentCounts((prev) => ({
                  ...prev,
                  [post._id]: count,
                }));
              }}
            />
          </div>
        </article>
      ))}

      {/* report modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Report Post</h2>

            {/* radio reasons */}
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

            {/* optional details */}
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

            {/* buttons */}
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
