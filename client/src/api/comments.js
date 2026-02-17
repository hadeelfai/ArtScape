import { getApiBaseUrl } from '../config.js';

// Get all comments
export async function getCommentByPost(postId){
    
    const token = localStorage.getItem("artscape:user")
    ? JSON.parse(localStorage.getItem("artscape:user")).token 
        : null;

    const res = await fetch(`${getApiBaseUrl()}/comments/${postId}`, {
        credentials : "include",
        headers: {
            "Content-Type": "application/json",Authorization: token ? `Bearer ${token}` : ""
        }
    });   
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

// Comments count
export async function getCommentCount(postId){
    
    const token = localStorage.getItem("artscape:user")
    ? JSON.parse(localStorage.getItem("artscape:user")).token 
        : null;

    const res = await fetch(`${getApiBaseUrl()}/comments/count/${postId}`, {
        credentials : "include",
        headers: {
            "Content-Type": "application/json" ,
            Authorization: token ? `Bearer ${token}` : ""
        }
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.count
}

// Add a comment
export async function addComment(postId , text ){
    const token = localStorage.getItem("artscape:user")
    ? JSON.parse(localStorage.getItem("artscape:user")).token 
        : null;

    const res = await fetch(`${getApiBaseUrl()}/comments/${postId}`, {
        method:"POST",
        credentials : "include",
        headers: {
            "Content-Type": "application/json" ,
            Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({text})
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

// Reply to a comment
export async function addReply(commentId , text){
    const token = localStorage.getItem("artscape:user")
    ? JSON.parse(localStorage.getItem("artscape:user")).token 
        : null;

    const res = await fetch(`${getApiBaseUrl()}/comments/reply/${commentId}`, {
        method:"POST",
        credentials : "include",
        headers: {
            "Content-Type": "application/json" ,Authorization: token ? `Bearer ${token}` : ""
            
        },
        body: JSON.stringify({text})
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}