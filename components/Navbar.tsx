import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { NAV_LINKS, ABOUT_DROPDOWN_LINKS } from '../constants';
import MenuIcon from './icons/MenuIcon';
import CloseIcon from './icons/CloseIcon';
import { useAuth } from '../contexts/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import ThemeToggle from './ThemeToggle';
import { UserRole } from '../types';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeLinkStyle = {
    fontWeight: '600',
    color: '#059669', // emerald-600
  };
  
  const isStaff = userProfile && [UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.MEDICAL_ADMIN, UserRole.HOSPITAL_STAFF].includes(userProfile.role);

  const renderAuthControls = () => {
    if (loading) {
      return <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>;
    }
    if (currentUser) {
      return <ProfileDropdown />;
    }
    return (
      <Link to="/login" className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-colors duration-300">
        Login / Register
      </Link>
    );
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">SHMS</span>
            </Link>
            {userProfile && (
              <span className="hidden md:inline-block px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border dark:border-gray-700">
                {userProfile.role}{userProfile.hospital ? ` • ${userProfile.hospital}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center">
             {/* Desktop Nav and Controls */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-8">
                {NAV_LINKS.filter(link => {
                  if (link.path === '/book-appointment' && userProfile?.role !== UserRole.PATIENT) return false;
                  return true;
                }).map((link) => (
                  <NavLink key={link.name} to={link.path} style={({ isActive }) => isActive ? activeLinkStyle : {}} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 transition-colors duration-300">
                    {link.name}
                  </NavLink>
                ))}
                {isStaff && (
                  <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeLinkStyle : {}} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 transition-colors duration-300">
                    Dashboard
                  </NavLink>
                )}
                {userProfile?.role === UserRole.MEDICAL_ADMIN && (
                  <NavLink to="/admin-inventory" style={({ isActive }) => isActive ? activeLinkStyle : {}} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 transition-colors duration-300">
                    Admin Inventory
                  </NavLink>
                )}
                {userProfile?.role === UserRole.MEDICAL_ADMIN && (
                  <NavLink to="/admin-inventory-alerts" style={({ isActive }) => isActive ? activeLinkStyle : {}} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 transition-colors duration-300">
                    Inventory Alerts
                  </NavLink>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button onClick={toggleDropdown} className="flex items-center text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 transition-colors duration-300">
                    <span>About</span>
                    <svg className={`w-4 h-4 ml-1 transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                      {ABOUT_DROPDOWN_LINKS.map((link) => (
                        <NavLink
                          key={link.name}
                          to={link.path}
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-700"
                        >
                          {link.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center ml-8 space-x-4">
                 <NotificationBell />
                 <ThemeToggle />
                 {renderAuthControls()}
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden flex items-center space-x-2">
              <NotificationBell />
              <ThemeToggle />
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Open mobile menu">
                {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-4">
              {[...NAV_LINKS, ...ABOUT_DROPDOWN_LINKS]
                .filter(link => !(link.path === '/book-appointment' && userProfile?.role !== UserRole.PATIENT))
                .map((link) => (
                <NavLink key={link.name} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 text-center py-2">
                  {link.name}
                </NavLink>
              ))}
              {isStaff && (
                <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 text-center py-2 font-semibold">
                  Dashboard
                </NavLink>
              )}
              {userProfile?.role === UserRole.MEDICAL_ADMIN && (
                <NavLink to="/admin-inventory" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 text-center py-2 font-semibold">
                  Admin Inventory
                </NavLink>
              )}
              {userProfile?.role === UserRole.MEDICAL_ADMIN && (
                <NavLink to="/admin-inventory-alerts" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 text-center py-2 font-semibold">
                  Inventory Alerts
                </NavLink>
              )}
              {userProfile && (
                <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300">Logged in as: <strong>{userProfile.role}</strong>{userProfile.hospital ? ` • ${userProfile.hospital}` : ''}</div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
               {currentUser ? (
                <>
                  {isStaff && <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 text-center py-2 font-semibold">Dashboard</NavLink>}
                  <NavLink to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 text-center py-2">Settings</NavLink>
                  <NavLink to="/history" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-500 text-center py-2">History</NavLink>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-center">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-colors duration-300 text-center">
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;