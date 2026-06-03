import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSite } from '../../contexts/SiteContext';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { siteSettings } = useSite();
  const navigate = useNavigate();
  const location = useLocation();

  const publicNavigation = [
    { name: 'Home', href: '/' },
    { name: 'How it Works', href: '/#how-it-works' },
    { name: 'Venues', href: '/venues' },
    { name: 'Events', href: '/events' },
    { name: 'Sports', href: '/sports' },
    { name: 'Support', href: '/support' },
  ];

  const accountNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bookings', href: '/bookings', icon: CalendarDays },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  if (user?.user_type === 'venue_owner') {
    accountNavigation.splice(1, 0, { name: 'My Venues', href: '/venues/manage', icon: Building2 });
  }

  if (user?.is_staff || user?.user_type === 'admin') {
    accountNavigation.unshift({ name: 'Admin', href: '/admin', icon: ShieldCheck });
  }

  const isActive = (href) => {
    if (href.includes('#')) return location.pathname === '/' && location.hash === href.slice(1);
    return href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" onClick={closeMenus} className="flex min-w-0 items-center gap-3">
            {siteSettings.logo_main ? (
              <img src={siteSettings.logo_main} alt={siteSettings.site_name || 'SportMeet'} className="h-9 w-auto" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-500 text-sm font-bold text-white">
                SM
              </div>
            )}
            <span className="truncate text-xl font-bold text-gray-950">{siteSettings.site_name || 'SportMeet'}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/register-venue-owner"
              className="ml-2 inline-flex items-center gap-2 rounded-md border border-green-600 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              <Building2 className="h-4 w-4" />
              List Your Venue
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.first_name || user?.username || 'Account'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    {accountNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Login
                </Link>
                <Link to="/register" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">
                  Sign Up
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 md:hidden"
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={closeMenus}
                className={`rounded-md px-3 py-3 text-sm font-medium ${
                  isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link to="/register-venue-owner" onClick={closeMenus} className="rounded-md px-3 py-3 text-sm font-medium text-green-700 hover:bg-green-50">
              List Your Venue
            </Link>
            {isAuthenticated ? (
              <>
                {accountNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} to={item.href} onClick={closeMenus} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
                <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                <Link to="/login" onClick={closeMenus} className="rounded-md border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700">
                  Login
                </Link>
                <Link to="/register" onClick={closeMenus} className="rounded-md bg-primary-500 px-3 py-2 text-center text-sm font-semibold text-white">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
