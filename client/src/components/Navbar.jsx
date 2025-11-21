import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import SearchBar from './SearchBar';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const navigationItems = [
    { name: "Home", path: "/" },
    { name: "Gallery", path: "/GalleryPage" },
    { name: "Community", path: "/CommunityPage" },
    { name: "News", path: "/NewsPage" },
  ];

  return (
    <>
      <header
        className={`fixed w-full z-50 transition-all duration-300 border-b 
          ${isOpen ? "bg-black border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className='px-6 md:px-12 py-5 pt-6 flex items-center justify-between'>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 25,
              delay: 0.3,
              duration: 1.2,
            }}
            className='flex items-center'
          >
            <Link to='/'>
              <h1
                className={`font-highcruiser text-lg md:text-xl lg:text-2xl 
                  ${isOpen ? "text-white" : "text-black"}`}
              >
                ArtScape
              </h1>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  delay: 0.7 + index * 0.1,
                }}
                className="relative"
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${isOpen ? "text-white" : "text-black"} font-albert lg:text-lg md:text-base 
                     transition-opacity duration-300 relative 
                     ${!isActive ? "hover:opacity-60" : ""}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.name}
                      {isActive && (
                        <span
                          className={`absolute top-full left-0 w-full h-[2px] 
                            ${isOpen ? "bg-white" : "bg-black"} 
                            lg:mt-[1.7rem] md:mt-[1.8rem]`}
                        ></span>
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Sign In Button - Desktop */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 1.1,
            }}
            className='flex items-center gap-x-4'
          >
            <div className='hidden lg:flex md:flex'>
              <SearchBar variant='icon'/>
            </div>
            <Link
              to="/signin"
              className={`lg:flex md:flex hidden px-4 py-2 rounded-full font-albert text-sm transition-colors duration-300
                ${isOpen
                  ? "border border-gray-400 text-white hover:bg-white hover:text-black"
                  : "border border-gray-300 text-black hover:bg-black hover:text-white"
                }`}
            >
              Sign In
            </Link>
          </motion.div>


          {/* Mobile Menu Button and Sign In */}
          <div className="lg:hidden md:hidden flex items-center space-x-4">
            <SearchBar variant='icon'/>

            {/* Sign In Button - Mobile */}
            <Link
              to="/signin"
              className={`px-3 py-1.5 rounded-full font-albert text-sm transition-colors duration-300
                ${isOpen
                  ? "border border-gray-400 text-white hover:bg-white hover:text-black"
                  : "border border-gray-300 text-black bg-white hover:bg-black hover:text-white"
                }`}
            >
              Sign In
            </Link>

            {/* Hamburger / Close Button */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 0.7,
              }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="p-2 relative w-6 h-6 flex items-center justify-center"
            >
              <span
                className={`absolute h-0.5 w-6 transition-all duration-300 
                  ${isOpen ? "rotate-45 bg-white" : "-translate-y-2 bg-black"}`}
              ></span>
              <span
                className={`absolute h-0.5 w-6 transition-all duration-300 
                  ${isOpen ? "opacity-0" : "bg-black"}`}
              ></span>
              <span
                className={`absolute h-0.5 w-6 transition-all duration-300 
                  ${isOpen ? "-rotate-45 bg-white" : "translate-y-2 bg-black"}`}
              ></span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed inset-0 bg-black z-40 lg:hidden md:hidden flex flex-col ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
      >
        <div className="flex flex-col items-center justify-center flex-1 space-y-16">
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 20 }}
              transition={{ delay: isOpen ? index * 0.1 + 0.2 : 0, duration: 0.3 }}
            >
              <NavLink
                to={item.path}
                onClick={toggleMenu}
                className={({ isActive }) =>
                  `text-white text-2xl font-light relative 
                  ${isActive ? "after:content-[''] after:block after:w-full after:h-[1px] after:bg-white after:mt-1" : "hover:opacity-60"}`
                }
              >
                {item.name}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default Navbar;
