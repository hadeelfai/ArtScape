import { Image } from "lucide-react"
import React, { useRef, useState } from "react"

function ImageUploader({onImageUpload}) {

    const fileInputRef = useRef(null)
    const [uploading, setUploading] = useState(false)

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return;

        setUploading(true)

        const formData = new FormData()
        formData.append('file',file)
        formData.append('upload_preset','post_mern')
        formData.append('folder','posts')

        try {
            const res = await fetch('https://api.cloudinary.com/v1_1/dzedtbfld/image/upload', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            onImageUpload(data.secure_url)

        } catch (error) {
            console.error('Upload error:' , error)
            alert("Upload failed!");
        }finally{
            setUploading(false)
        }
    }
    return(
        <div className="relative">
            <button onClick={()=> fileInputRef.current.click()} type="button">
                <Image size={20}/>
            </button>

            <input type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            />

        {uploading && (
            <div className="flex text-gray-400 items-center justify-center">
                Uploading...
            </div>
        )}

        </div>
    )
}


export default ImageUploader