import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-2xl mx-auto border-x border-gray-200 bg-white pt-20">
        {children}
      </main>

      <Footer />
    </div>
  )
}
export default Layout
