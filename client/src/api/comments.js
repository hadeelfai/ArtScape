//import Comments from "../../../backend/models/Comments.js"

const comments = "http://localhost:5500/comments"


//get all comments

export async function getCommentByPost(postId){
    const res = await fetch(`${comments}/${postId}`, {
        
        credentials : "include",
        headers: {"Content-Type": "application/json"}
    
    })
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
    
}

//comments countt
export async function getCommentCount(postId){
    const res = await fetch(`${comments}/count/${postId}`, {

        credentials : "include",
        headers: {"Content-Type": "application/json"},    
    })
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return data.count
}

//add a comment
export async function addComment(postId , text){
    const res = await fetch(`${comments}/${postId}`, {
        method:"POST",
        credentials : "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({text})
    
    })
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
    
}


//reply to a comment

export async function addReply(commentId , text){
    const res = await fetch(`${comments}/reply/${commentId}`, {
        method:"POST",
        credentials : "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({text})
    
    })
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
    
}