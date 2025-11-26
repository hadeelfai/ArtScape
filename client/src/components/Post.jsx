import React, { useState, useEffect } from 'react'
import ImageUploader from './ImageUploader'
import { toast } from 'sonner'

function Post({ onPostCreated, editingPost, onEditCompleted }) {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [text, setText] = useState("")

  // Populate fields when editing
  useEffect(() => {
    if (editingPost) {
      setText(editingPost.text || "")
      setUploadedImage(editingPost.image || null)
    }
  }, [editingPost])

  const handlePost = async () => {
    const user = JSON.parse(localStorage.getItem("artscape:user"))
    const token = user?.token
    if (!token) {
      toast.error("You must sign in to post")
      return
    }
    
    if (!text && !uploadedImage) {
      toast.error("Please add an image or description")
      return
    }

    try {
      if (editingPost) {
        // Edit existing post
        const user = JSON.parse(localStorage.getItem("artscape:user"))
        const token = user?.token
        
        const res = await fetch(`http://localhost:5500/posts/${editingPost._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" ,
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text, image: uploadedImage 
            
          })
        })
        if (!res.ok) throw new Error("Failed to update post")
        
        toast("Post updated successfully!")
        if (onEditCompleted) onEditCompleted()
      } else {
        // Create new post

        const user = JSON.parse(localStorage.getItem("artscape:user"))
        const token = user?.token
        const res = await fetch('http://localhost:5500/posts', {
          method: "POST",
          headers: { "Content-Type": "application/json" 
            ,Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text, image: uploadedImage })
        })
        if (!res.ok) throw new Error
            ("Failed to create post")
        
        toast("Post uploaded successfully!")
        if (onPostCreated) onPostCreated()
      }

      // Clear form
      setText("")
      setUploadedImage(null)
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong!")
    }
  }

  return (
    <div id="upload-section" className='flex flex-col p-3 border border-b-gray-200'>
      <div className='flex items-center gap-4'>
        <img className='w-10 h-10 rounded-full object-cover' src='/avatar.png'/>
        <input
          placeholder='Share and Describe Your Art..'
          value={text}
          className='flex-1 px-3 py-2 text-sm border border-none outline-none'
          type="text"
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className='flex justify-between'>
        <div className='ml-24 flex items-center gap-4 text-primary mt-2 hover:text-gray-400 transition-colors duration-200'>
          <ImageUploader onImageUpload={setUploadedImage}/>
        </div>
        <button onClick={handlePost} className='bg-black text-white font-semibold px-5 py-1 rounded-full hover:bg-gray-400 transition-colors duration-200'>
          {editingPost ? "Update" : "Post"}
        </button>
      </div>

      {uploadedImage && (
        <div className='relative mt-4 w-[80%]'>
          <img src={uploadedImage} className='w-full h-64 object-cover'/>
        </div>
      )}
    </div>
  )
}

export default Post
