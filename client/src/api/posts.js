const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5500";
const POSTS = `${API_BASE}/posts`;


export async function toggleLike(postId){
    const res = await fetch(`${POSTS}/like/${postId}`,{
        method:'POST',
        credentials: "include",
        headers: {'Content-Type': 'application/json',  
            'Authorization': `Bearer ${localStorage.getItem("token")}`}
    })

    if(!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
}