import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addComment, addReply, getCommentByPost } from '../api/comments'
import { toast } from 'sonner'
import { MessageCircle, Send, Trash } from 'lucide-react'
import { format } from "timeago.js";
import { getApiBaseUrl } from '../config.js';

function CommentsSection({postId , showComments , commentsCount , onCountChange}){

    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState("")
    const [replyText, setReplyText] = useState({})
    const [showReplyInput, setShowReplyInput] = useState({})
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentsLoaded, setcommentsLoaded] = useState(false)
 

    //load comments for signed in users only
    const loadComments = async ()=> {
    const user = JSON.parse(localStorage.getItem("artscape:user"))
    const token = user?.token

    if (!token) {
      toast.error("You must sign in to view comments")
      return
    }   
        setLoadingComments(true)

        try {
            const data = await getCommentByPost(postId)
            setComments(data)
            setcommentsLoaded(true)
        } catch (error) {
            toast.error("Failed to load comments")
            console.error(error)
        }finally{
            setLoadingComments(false)
        }
    }

    useEffect(()=> {
        if(showComments && !commentsLoaded){
            loadComments()
        }
    },[showComments ,commentsLoaded])

    //add comment
    const handleAddComment = async()=> {
        const text = commentText.trim()

        if(!text){
            toast.error("comment cannot be empty")
            return
        }
        try {
            const newComment = await addComment(postId, text)
            setComments(prev=> [newComment, ...prev])
            setCommentText("")
            toast.success("Comment added")

            if(onCountChange){
                onCountChange(commentsCount + 1 )
            }
        } catch (error) {
            toast.error("Failed to add comments")
            console.error(error)
        }
    }

// delete a comment
    const deleteComment = async (commentId) => {
  try {
    const user = JSON.parse(localStorage.getItem("artscape:user"))
    const token = user?.token;

    const res = await fetch(`${getApiBaseUrl()}/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) throw new Error("Failed delete")

    // remove from UI
    setComments(prev => prev.filter(c => c._id !== commentId))

    onCountChange(comments.length - 1)

  } catch (error) {
    console.error(error)
    toast.error("Failed to delete comment")
  }
}

   
//reply to comment
 const handleAddReply = async (commentId) => {
  const text = replyText[commentId]?.trim();
  if (!text) {
    toast.error("Reply cannot be empty");
    return;
  }
  try {
    const updatedComment = await addReply(commentId, text);

    setComments(prev => prev.map(comment =>
      comment._id === commentId ? updatedComment : comment
    ));

    // Clear input
    setReplyText(prev => ({ ...prev, [commentId]: "" }));
    toast.success("Reply added");

    // Update count based on previous state
    if (onCountChange) {
      onCountChange(prevCount => prevCount + 1); 
    }
  } catch (error) {
    toast.error("Failed to add reply");
    console.error(error);
  }
};

// delete a reply
    const deleteReply = async (replyId, commentId) => {
  try {
    const user = JSON.parse(localStorage.getItem("artscape:user"))
    const token = user?.token

    const res = await fetch(`${getApiBaseUrl()}/comments/reply/${commentId}/${replyId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to delete reply");

    // update UI
    setComments(prevComments =>
      prevComments.map(comment =>
        comment._id === commentId
          ? { ...comment, replies: comment.replies.filter(r => r._id !== replyId) }
          : comment
      )
    );
    toast.success("Reply deleted");

  } catch (err) {
    console.error(err);
    toast.error("Failed to delete reply");
  }
};

    return (
        <>
        {/* comments section */}

        {showComments && (
            <div className='mt-4 space-y-4'>
                {/*add comment input */}
                <div className='flex items-center gap-2'>
                    
                    <input type='text'
                    placeholder='share your thoughts...'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded'
                    value = {commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    />

                    <button onClick={handleAddComment} 
                    className='bg-black px-3 py-2 text-white rounded'>
                        <Send size={18}/></button>

                       </div> 

                        {/*comment list */}
                        {loadingComments ? (
                            <div className='flex justify-center py-6'>

                                    <div className='w-6 h-6 border-t-primary border-2 
                                    border-gray-300 animate-spin rounded-full'>

                                    </div>
                            </div>
                        ):(
                            <div className='space-y-3'> 
                            {comments.length === 0 ? (
                                <p className='text-gray-400 text-sm'>No comments yet</p>
                            ): (
                                comments?.map((comment) => (
                                    <div key={comment?._id} className='bg-gray-50 p-3 rounded-lg'>

                                        <div className='flex gap-2'>{/**need a check for comment profile pic */}
                                            <Link to={comment?.user?._id ? `/profile/${comment.user._id}` : '#'} className="shrink-0">
                                                <img className='h-8 w-8 rounded-full object-cover' 
                                                src={comment?.user?.profileImage || '/avatar.png'} alt="" />
                                            </Link>

                                            <div className='flex-1'> 
                                                <div className='flex items-center gap-2'>
                                                    <Link to={comment?.user?._id ? `/profile/${comment.user._id}` : '#'} className="text-sm font-medium hover:underline text-gray-900">
                                                        {comment?.user?.name }
                                                    </Link>
                                                    <Link to={comment?.user?._id ? `/profile/${comment.user._id}` : '#'} className='text-sm text-gray-600 hover:underline'>
                                                        @{comment?.user?.username }
                                                    </Link>
                                                    
                                                    <span className='text-gray-400 text-sm'>
                                                        {format(comment?.createdAt)}</span>
                                                </div>

                                                <p className='text-sm mt-1'>{comment?.text}</p>                                               

                                                {/*button comment */}
                                                <button
                                                className='text-sm text-gray-500 hover:text-black'
                                                onClick={() =>
                                                    setShowReplyInput(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))
                                                }
                                                >
                                                reply
                                                </button>

                                                {/* Delete button only for comment owner */}
                                                {JSON.parse(localStorage.getItem("artscape:user"))?.id === comment?.user?._id && (
                                                <button
                                                    className='ml-2 text-xs text-red-500 hover:text-red-700 gap-1'
                                                    onClick={() => deleteComment(comment._id)}
                                                >
                                                    Delete
                                                </button>
                                                )}

                                     
                                              {/* reply input */}
                                                {showReplyInput[comment._id] && (
                                                    <div className='flex items-center gap-2 mt-2'>
                                                        <input className='flex-1 px-2 py-1 border border-gray-300'
                                                        type='text' placeholder='add reply...' 
                                                        value={replyText[comment._id]} 
                                                        onChange={(e) => setReplyText(prev => ({...prev,
                                                         [comment._id]: e.target.value}))}
                                                         onKeyPress={(e) => e.key === "Enter" && handleAddReply(comment._id)}
                                                         />

                                                         <button onClick={()=>handleAddReply(comment._id)}
                                                         className=' px-3 py-2 text-white rounded bg-gray-400'>
                                                         <Send size={18}/></button>

                                                        
                                                    </div>
                                                )}

                                                {/*Replies */}
                                                {comment?.replies.length > 0 && (
                                                    <div className='mt-2 ml-4 space-y-2'>
                                                    {comment?.replies?.map((reply, idx)=> (
                                                        
                                                        <div key={idx} className='flex gap-2'>
                                                        <Link to={reply?.user?._id ? `/profile/${reply.user._id}` : '#'} className="shrink-0">
                                                            <img src={reply?.user?.profileImage || '/avatar.png'} 
                                                            className='h-6 w-6 rounded-full object-cover' alt="" />
                                                        </Link>

                                                        <div className='flex-1 bg-white p-2 rounded'> 

                                                            <div className='flex items-center gap-2'> 
                                                                <Link to={reply?.user?._id ? `/profile/${reply.user._id}` : '#'} className="font-semibold text-xs hover:underline text-gray-900">{reply?.user?.name}</Link>
                                                                <Link to={reply?.user?._id ? `/profile/${reply.user._id}` : '#'} className="font-semibold text-xs text-gray-500 hover:underline">@{reply?.user?.username}</Link>
                                                      
                                                                <span className='text-gray-400 text-sm'>
                                                                    {reply?format(reply.createdAt) : ""}
                                                                </span>
                                                            </div>
                                                            <p className='text-xs mt-1'>{reply?.text}</p>
                                                        </div>
                                                        {/*button to delete reply */}
                                                        {JSON.parse(localStorage.getItem("artscape:user"))?.id === reply?.user?._id && (//only for the reply owner
                                                            <button
                                                            onClick={() => deleteReply(reply._id, comment._id)}
                                                            className="text-red-500 hover:text-red-700 text-xs "
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                        </div>

                                                        
                                                    ))}
                                                    </div>                                                   
                                                )}                                           
                                            </div>                                           
                                        </div>
                                        
                                    </div>                                    
                                ))
                            )}
                            </div>
                        )}
                
            </div>
        )}
        </>
    )
}


export default CommentsSection