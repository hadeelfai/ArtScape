import React, { useState } from 'react'
import ImageUploader from './ImageUploader'

function Post(){

    const [uploadedImage, setUploadedImage] = useState(null)
    const [text, setText] = useState("")

    
    
    const handlePost = async () => {
        if(!text && !uploadedImage){
            alert("Please add image or discription")
            return
        }
        const newPost = {
            text,
            image: uploadedImage,
            createdAt: new Date()
        }

        try {
            const res = await fetch ('http://localhost:5500/posts' , {
                method: "POST",
                headers: {"Content-Type" : "application/json"},
                body: JSON.stringify(newPost)
            })
            const data = await res.json()
            console.log("Post created:", newPost)

            setText("")
            setUploadedImage(null)
            alert("Post uploaded successfully!")
        } catch (error) {
            console.error("Error saving post:",error)
        }
        
    }

    return (
        <div className='flex flex-col p-3 border border-b-gray-200'>
            <div className='flex items-center gap-4'>
            <img className='w-10 h-10 rounded-full object-cover' src='/avatar.png'/>
            
            <input placeholder='Share and Describe Your Art..' value={text} 
            className='flex-1 px-3 py-2 text-sm border border-none outline-none ' 
            type="text" onChange={(e) => setText(e.target.value)}/>

            </div>

            <div className='flex justify-between'>
            <div className='ml-24 flex items-center gap-4 text-primary mt-2 
            hover:text-gray-400 transition-colors duration-200'>
            <ImageUploader onImageUpload = {setUploadedImage}/>
            </div>

            <button onClick={handlePost} className='bg-black text-white font-semibold px-5 py-1 
            rounded-full hover:bg-gray-400 transition-colors duration-200'>Post</button>
            </div>

            {uploadedImage && ( <div className='relative mt-4 w-[80%]'> 
                <img src={uploadedImage} className='w-full h-64 object-cover '></img>
            </div>) }
        
        
    </div>



    )
}

export default Post