import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Bell, LogOut, User, Package, Palette, ChevronDown } from 'lucide-react';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext.jsx';
import { getApiBaseUrl } from '../config.js';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showGallerySubmenu, setShowGallerySubmenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0); // Manage notification count from your notification system
  const profileDropdownRefDesktop = useRef(null);
  const profileDropdownRefMobile = useRef(null);

  // Get user data from AuthContext
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  
  // Check if we're on a Gallery sub-page (explore or marketplace)
  const isGalleryActive = location.pathname === '/GalleryPage' || location.pathname === '/explore' || location.pathname === '/marketplace';
  const { cartItems } = useCart();

  //fetch unread notification count from backend
  const fetchNotificationCount = async () => {
    // If user is not logged in no notifications mark
    if (!isAuthenticated || !user?.token) {
      setNotificationCount(0);
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/notifications`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`, // passing token so backend knows who we are
        },
        credentials: "include", // keeps cookies if used
      });

      // If backend responded with an error, just silently fail
      if (!res.ok) {
        console.error("Failed to load notifications:", res.status);
        return;
      }

      // Read notifications array
      let data = [];
      try {
        data = await res.json();
      } catch {
        data = [];
      }

      // Count only unread notifications
      const unreadCount = Array.isArray(data)
        ? data.filter((item) => item.read === false).length
        : 0;

      // Update bell badge number
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications in Navbar:", error);
    }
  };


  // Decide where the profile avatar should go
  const profilePath = user
  ? isAdmin
    ? "/admin"
    : `/profile/${user.id || user._id}`
  : "/signin";

  // Note: Desktop dropdown uses hover (onMouseEnter/onMouseLeave), so no click-outside handler needed
  // Mobile dropdown still uses click for better touch experience

  // Handle logout
  const handleLogout = async () => {
    setShowProfileDropdown(false);
    await logout();
    navigate('/signin');
  };



  const toggleMenu = () => setIsOpen(!isOpen);

  const navigationItems = [
    { name: "Home", path: "/" },
    {
      name: "Gallery",
      path: "/GalleryPage",
      submenu: [
        { name: "Explore", path: "/explore" },
        { name: "Marketplace", path: "/marketplace" }
      ]
    },
    { name: "Community", path: "/CommunityPage" },
    { name: "News", path: "/News" },
  ];


   // Checking notification count when user logs in,
  useEffect(() => {
    fetchNotificationCount();
  }, [isAuthenticated, user?.token, location.pathname]);

    // Listen for global "notificationsRead" event (fired from NotificationsPage)
  useEffect(() => {
    const handleNotificationsRead = () => {
      // Re-fetch count so the red badge disappears
      fetchNotificationCount();
    };

    window.addEventListener("notificationsRead", handleNotificationsRead);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("notificationsRead", handleNotificationsRead);
    };
  }, [isAuthenticated, user?.token]); // re-bind if auth state changes



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
                onMouseEnter={() => item.submenu && setShowGallerySubmenu(true)}
                onMouseLeave={() => item.submenu && setShowGallerySubmenu(false)}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) => {
                    // For Gallery, check if we're on Gallery or its sub-pages
                    const shouldBeActive = item.name === 'Gallery' ? isGalleryActive : isActive;
                    return `${isOpen ? "text-white" : "text-black"} font-albert lg:text-lg md:text-base 
                     transition-opacity duration-300 relative 
                     ${!shouldBeActive ? "hover:opacity-60" : ""}`
                  }}
                >
                  {({ isActive }) => {
                    // For Gallery, check if we're on Gallery or its sub-pages
                    const shouldBeActive = item.name === 'Gallery' ? isGalleryActive : isActive;
                    return (
                      <>
                        {item.name}
                        {shouldBeActive && (
                          <span
                            className={`absolute top-full left-0 w-full h-[2px] 
                              ${isOpen ? "bg-white" : "bg-black"} 
                              lg:mt-[1.7rem] md:mt-[1.8rem]`
                            }
                          ></span>
                        )}
                      </>
                    );
                  }}
                </NavLink>

                {/* Submenu Dropdown */}
                {item.submenu && (
                  <AnimatePresence>
                    {showGallerySubmenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="
                        absolute top-full left-0
                        mt-3 bg-white border border-gray-200
                        shadow-sm rounded-sm
                        w-[120px] text-center
                        z-50
                        "
                      >
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.path}
                            className="
                            py-2 block font-albert text-sm
                          text-black hover:bg-gray-100
                            border-b last:border-b-0
                            "
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </motion.div>

                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            ))}
          </nav>

          {/* Right Side - Desktop */}
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
            {isAuthenticated ? (
              // Logged In State - Show Icons
              <div className='hidden lg:flex md:flex items-center gap-x-4'>
                <Link
                  to="/cart"
                  className={`p-2 hover:opacity-60 transition-opacity ${isOpen ? "text-white" : "text-black"}`}
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {cartItems.length}
                      </span>
                    )}
                  </div>
                </Link>

                <Link
                  to="/notifications"
                  className={`p-2 hover:opacity-60 transition-opacity relative ${isOpen ? "text-white" : "text-black"}`}
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      {notificationCount}
                    </span>
                  )}
                </Link>

                <div className={`${isOpen ? "text-white" : "text-black"}`}> 
                  <SearchBar variant='icon' />
                </div>

                {user && (
                  <div 
                    className="relative" 
                    ref={profileDropdownRefDesktop}
                    onMouseEnter={() => setShowProfileDropdown(true)}
                    onMouseLeave={() => setShowProfileDropdown(false)}
                  >
                    <Link
                      to={profilePath}
                      className="hover:opacity-60 transition-opacity cursor-pointer block"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        <img
                          src={user.profileImage || user.avatar || '/Profileimages/User.jpg'}
                          alt={user.name || "User"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/Profileimages/User.jpg';
                          }}
                        />
                      </div>
                    </Link>

                    {/* Profile Dropdown Menu */}
                    <AnimatePresence>
                      {showProfileDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        >
                          <div className="py-1">
                            <Link
                              to={profilePath}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <User className="w-4 h-4 mr-3" />
                              My Profile
                            </Link>
                            <Link
                              to="/orders"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Package className="w-4 h-4 mr-3" />
                              My Orders
                            </Link>
                            <Link
                              to="/sales"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Palette className="w-4 h-4 mr-3" />
                              My Sales
                            </Link>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4 mr-3" />
                              Log out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : (
              // Not Logged In State - Show Sign In Button
              <>
                <div className='hidden lg:flex md:flex'>
                  <SearchBar variant='icon' />
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
              </>
            )}
          </motion.div>


          {/* Mobile Menu Button and Icons */}
          <div className="lg:hidden md:hidden flex items-center space-x-3">
            {isAuthenticated ? (
              // Mobile - Logged In Icons
              <>
                <Link
                  to="/cart"
                  className={`p-2 ${isOpen ? "text-white" : "text-black"}`}
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {cartItems.length}
                      </span>
                    )}
                  </div>
                </Link>

                <Link
                  to="/notifications"
                  className={`p-2 relative ${isOpen ? "text-white" : "text-black"}`}
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      {notificationCount}
                    </span>
                  )}
                </Link>

                <div className={`${isOpen ? "text-white" : "text-black"}`}>
                  <SearchBar variant='icon' />
                </div>

                <div className="relative flex items-center gap-1" ref={profileDropdownRefMobile}>
                  <Link
                    to={profilePath}
                    className={`${isOpen ? "text-white" : "text-black"} block`}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setIsOpen(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      <img
                        src={user?.profileImage || user?.avatar || '/Profileimages/User.jpg'}
                        alt={user?.name || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/Profileimages/User.jpg';
                        }}
                      />
                    </div>
                  </Link>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className={`${isOpen ? "text-white" : "text-black"} focus:outline-none`}
                    aria-label="Open profile menu"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Profile Dropdown Menu - Mobile */}
                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-52 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                      >
                        <div className="py-1">
                          <Link
                            to={profilePath}
                            onClick={() => {
                              setShowProfileDropdown(false);
                              setIsOpen(false);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <User className="w-4 h-4 mr-3" />
                            My Profile
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => {
                              setShowProfileDropdown(false);
                              setIsOpen(false);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Package className="w-4 h-4 mr-3" />
                            My Orders
                          </Link>
                          <Link
                            to="/sales"
                            onClick={() => {
                              setShowProfileDropdown(false);
                              setIsOpen(false);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Palette className="w-4 h-4 mr-3" />
                            My Sales
                          </Link>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Log out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              // Mobile - Not Logged In
              <>
                <SearchBar variant='icon' />
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
              </>
            )}

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
              className="flex flex-col items-center"
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

              {/* Mobile Submenu */}
              {item.submenu && (
                <div className="flex flex-col items-center mt-4 space-y-3">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.path}
                      onClick={toggleMenu}
                      className="text-gray-400 text-lg font-light hover:text-white transition-colors"
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default Navbar;
