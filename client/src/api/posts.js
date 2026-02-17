import { getApiBaseUrl } from '../config.js';


export async function toggleLike(postId){
    const res = await fetch(`${getApiBaseUrl()}/posts/like/${postId}`,{
        method:'POST',
        credentials: "include",
        headers: {'Content-Type': 'application/json',  
            'Authorization': `Bearer ${localStorage.getItem("token")}`}
    })

    if(!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
}