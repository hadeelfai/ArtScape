import React, { useState } from "react"
import { useSearchParams } from "react-router-dom"
import Post from "../components/Post"
import PostFeeds from "../components/PostFeeds"
import Navbar from "../components/Navbar"

function CommunityPage() {
  const [searchParams] = useSearchParams()
  const focusPostId = searchParams.get("post")

  const loggedInUser = localStorage.getItem("artscape:user")
    ? JSON.parse(localStorage.getItem("artscape:user"))
    : null;

  const [editingPost, setEditingPost] = useState(null)
  const [activeTab, setActiveTab] = useState("foryou")
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div>
      <div className='border flex items-center justify-around border-b-gray-200 p'>
        <button
          className={`flex-1 text-center py-3 font-semibold${activeTab === "foryou" ? "border border-b-4 border-black font-bold" : "text-gray-500"}`}
          onClick={() => setActiveTab("foryou")}
        >
          For You
        </button>
        <button
          className={`flex-1 text-center py-3 font-semibold${activeTab === "following" ? "border border-b-4 border-black font-bold" : "text-gray-500"}`}
          onClick={() => setActiveTab("following")}
        >
          Following
        </button>
      </div>
      <Post
        editingPost={editingPost}
        onPostCreated={() => setRefreshKey((prev) => prev + 1)}
        onEditCompleted={() => {
          setRefreshKey((prev) => prev + 1)
          setEditingPost(null)
        }}
      />
      <PostFeeds
        refreshKey={refreshKey}
        activeTab={activeTab}
        loggedInUser={loggedInUser}
        focusPostId={focusPostId}
        onStartEditing={(post) => {
          setEditingPost(post)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}
      />
    </div>
  )
    
}

export default CommunityPage