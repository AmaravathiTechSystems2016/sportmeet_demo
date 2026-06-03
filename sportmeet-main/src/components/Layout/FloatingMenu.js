import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSite } from '../../contexts/SiteContext';
import { Building2, LogOut, Menu, Search, User, X } from 'lucide-react';

const FloatingMenu = ({ showSearch = false, searchQuery = '', onSearchChange = () => {}, onSearch = () => {} }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { siteSettings } = useSite();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isScrolled) return null;

  const navigation = [
    { name: 'Venues', href: '/venues' },
    { name: 'Events', href: '/events' },
    { name: 'Sports', href: '/sports' },
  ];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onSearch();
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="fixed left-0 right-0 top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500 text-xs font-bold text-white">SM</div>
          <span className="hidden font-bold text-gray-950 sm:inline">{siteSettings.site_name || 'SportMeet'}</span>
        </Link>

        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="hidden min-w-0 flex-1 max-w-md md:flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search city or venue"
              className="h-9 min-w-0 flex-1 rounded-l-md border border-gray-200 px-3 text-sm outline-none focus:border-primary-500"
            />
            <button type="submit" className="inline-flex h-9 items-center justify-center rounded-r-md bg-primary-500 px-3 text-white">
              <Search className="h-4 w-4" />
            </button>
          </form>
        )}

        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link key={item.name} to={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              {item.name}
            </Link>
          ))}
          <Link to="/register-venue-owner" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50">
            <Building2 className="h-4 w-4" />
            List Venue
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                <User className="h-4 w-4" />
                {user?.first_name || 'Dashboard'}
              </Link>
              <button type="button" onClick={handleLogout} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Login
            </Link>
          )}
        </nav>

        <button type="button" onClick={() => setIsMenuOpen((value) => !value)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 md:hidden">
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          {showSearch && (
            <form onSubmit={handleSearchSubmit} className="mb-3 flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search city or venue"
                className="h-10 min-w-0 flex-1 rounded-l-md border border-gray-200 px-3 text-sm outline-none"
              />
              <button type="submit" className="rounded-r-md bg-primary-500 px-3 text-white">
                <Search className="h-4 w-4" />
              </button>
            </form>
          )}
          <div className="grid gap-1">
            {[...navigation, { name: 'List Your Venue', href: '/register-venue-owner' }].map((item) => (
              <Link key={item.name} to={item.href} onClick={() => setIsMenuOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {item.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingMenu;
