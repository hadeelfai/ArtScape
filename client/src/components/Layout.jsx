import React from 'react'
import LeftSideBar from './LeftSideBar'
import Navbar from './Navbar'
//import Footer from './Footer'

function Layout({ children }) {

  return (   
      <div className="flex flex-1 justify-center">
       <Navbar/>
        {/* Sidebar hidden on small screens */}
        <div className="hidden md:block ">
          <LeftSideBar />
        </div>

        {/* Main feed container */}
        <main className="w-full max-w-2xl border-x border-gray-200 bg-white pt-20">
          {children}
        </main>
      </div>     
  ) 
}

export default Layout
