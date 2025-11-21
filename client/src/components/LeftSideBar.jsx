import React from 'react'
import { Search, Bell, Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'

function LeftSideBar() {

    const menu = [
        { icon: <Search />, label: 'Search', path: '/search' }
        
    ]

    return (
        <div className='hidden ml-9 md:flex flex-col w-64 p-4 
        border-r border-gray-200 h-screen sticky top-20'>

            <nav className='flex flex-col gap-4'>
                {menu.map((item, i) => (
                    <Link 
                        key={i}
                        to={item.path}
                        className='flex items-center gap-3 text-lg p-2 hover:text-gray-400
                        cursor-pointer font-bold transition-colors duration-200'
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

        </div>
    )
}

export default LeftSideBar
