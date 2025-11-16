import { Heart } from 'lucide-react'
import React, { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react'
import {toast} from 'sonner'
import CommentsSection from './CommentsSection'
import { MessageCircle } from 'lucide-react'
import { getCommentCount } from '../api/comments'


function PostFeeds(){

    const [posts , setPosts] = useState([])
    const [ loading, setLoading] = useState(true)
    const [err,setErr] = useState("")
    const [isPending , startTransition] = useTransition()
    const [showComments, setShowComments] = useState({})
    const [commentCounts, setCommentCounts] = useState({})  
    const [optimisticPosts , setOptimisticPosts] = useOptimistic(
        
        posts,
        (state , {postId, liked, likesCount}) => {
            return state.map(post => 
                post._id === postId ? {...post , likes: Array(likesCount).fill(null),
                    isLikedByUser : liked} : post
            )
        }
    )

    const handleLike = async (postId, currentLikesCount, isCurrentlyLiked )=> {
        const newLiked = !isCurrentlyLiked

        const newLikesCount = newLiked ? currentLikesCount + 1 : currentLikesCount -1
    

        startTransition(async() => {
            setOptimisticPosts({
        postId,
        liked:newLiked,
        likesCount:newLikesCount
    })

    try {
            const res = await fetch(`http://localhost:5500/posts/like/${postId}` 
                ,{
                method: "POST",
                headers:{"Content-Type" : "application/json"}
            })

            if(!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json()

            setPosts(prevPosts => 
                prevPosts.map(post => post._id === postId? {...post ,
                    likes : Array(data.likesCount).fill(null),
                    isLikedByUser : data.liked } : post)
            )
    } catch (error) {
        toast.error("Failed to update like")
        loadPosts()
    }
     })
    }
   

    const loadPosts = useCallback(async () => {
        try {
            setLoading(true)
            setErr("")
            const res = await fetch ("http://localhost:5500/posts" ,{
                method: "GET",
                headers:{"Content-Type" : "application/json"}

            })
            if(!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json()
            setPosts(data)


            const counts = {}
            await Promise.all(
                data.map(async(post) => {
                    try {
                        const count = await getCommentCount(post?._id)
                        counts[post?._id] = count
                    } catch (error) {
                        console.error("Failed to load count",error)
                    }
                })
            )
            setCommentCounts(counts)
            
        } catch (error) {
            setErr ("Error while loading posts")
        }finally{
            setLoading(false)
        }
    }, [])

    useEffect( () => {
        loadPosts()
    } , [loadPosts])


     //toggle comments visibility

    const toggleComments = (postId) => {
        setShowComments(prev=> ({
            ...prev,
            [postId] : !prev[postId]
        }))
    }

    if(loading) return <div className='flex items-center justify-center h-40'>

        <div className='w-10 h-10 border-t-primary border-4 border-gray-300 rounded-full animate-spin'> </div>
    </div>

    if(err) return <div className='p-4 text-sm text-red-600'>{err}</div>
    
    if(!optimisticPosts.length) return <div className='text-gray-500 flex 
    items-center justify-center'>No posts yet...</div>
    
    return(
        <div>{optimisticPosts?.map( (post) => (
            <article className='border-b border-gray-200 p-4 flex gap-3'>

                <img src={post?.user?.avatar || "/avatar.png"} className='h-10 w-10 rounded-full object-cover'/>

                <div className='flex-1'>
                    <div className='flex items-center gap-2'> 

                        <span>{post?.user?.name}</span>
                        <span>{post?.user?.email}</span>
                        <span className='text-gray-400 text-sm'>{new Date(post?.createdAt).toLocaleString()}</span>
                    </div>
                    <p className='mt-2 whitespace-prepwrap'> {post?.text}</p>

                    {post?.image && (
                        <img src={post?.image}
                        className='mt-3 rounded-2xl max-h-[600px] w-full object-cover'
                        loading="lazy"
                        />
                    )}


                    <div className='mt-3 flex items-center gap-2 text-sm text-gray-500'>
                        <button type='button' className='flex items-center gap-2' disabled={isPending}
                         onClick={ () => handleLike(post._id,
                             Array.isArray(post.likes)? post.likes.length : 0)}>
                            <Heart className={post?.isLikedByUser ?
                                 'fill-red-500 text-red-500' : 'text-gray-500'} /> 

                                 <span className={post?.isLikedByUser ?
                                 'fill-red-500 text-red-500' : 'text-gray-500'}> 
                                 {Array.isArray(post.likes)? post.likes.length : 0}
                                 </span>
                        </button>

                        {/* comment button */}
                                <button onClick={()=>toggleComments(post?._id)} className='flex items-center 
                                gap-2 hoover:text-primary transition-colors'> 
                        
                                <MessageCircle className={showComments[post?._id] ?"text-primary" : ""}/>
                        
                                <span className={showComments[post?._id]? "text-primar" : ""}>
                                    {commentCounts[post?._id] || 0}
                        
                                </span>
                                </button>
                    </div>
                        <CommentsSection postId= {post._id}
                        showComments = {showComments[post?._id] || false}
                        commentsCount = {commentCounts[post._id] || 0}
                        onCountChange={(count) => {
                            setCommentCounts(prev => ({
                                ...prev,
                                [post._id] : count
                            }))
                        }}

                        />
                   
                </div>
            </article>
        ))}</div>
    )
}

export default PostFeeds