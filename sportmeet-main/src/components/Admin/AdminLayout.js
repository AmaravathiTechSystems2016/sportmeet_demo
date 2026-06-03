import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Star, 
  BarChart3, 
  Settings, 
  Bell,
  ChevronDown,
  ChevronRight,
  User,
  Plus,
  List,
  Gamepad2,
  Wrench,
  Building,
  Percent
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSite } from '../../contexts/SiteContext';

const AdminLayout = () => {
  const { siteSettings } = useSite();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home, current: location.pathname === '/admin' },
    { 
      name: 'Users', 
      icon: Users, 
      current: location.pathname.includes('/admin/users'),
      children: [
        { name: 'All Users', href: '/admin/users', icon: Users },
        { name: 'Venue Owners', href: '/admin/users/venue-owners', icon: Building }
      ]
    },
    { 
      name: 'Venues', 
      icon: MapPin, 
      current: location.pathname.includes('/admin/venues'),
      children: [
        { name: 'All Venues', href: '/admin/venues', icon: List },
        { name: 'Create Venue', href: '/admin/venues/create', icon: Plus },
        { 
          name: 'Master Data', 
          icon: Wrench,
          children: [
            { name: 'Sports', href: '/admin/venues/sports', icon: Gamepad2 },
            { name: 'Amenities', href: '/admin/venues/amenities', icon: Wrench }
          ]
        }
      ]
    },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar, current: location.pathname.includes('/admin/bookings') },
    { 
      name: 'Events', 
      icon: Calendar, 
      current: location.pathname.includes('/admin/events'),
      children: [
        { name: 'View Events', href: '/admin/events', icon: List },
        { name: 'Create Event', href: '/admin/events/create', icon: Plus },
        { name: 'Event Bookings', href: '/admin/events/bookings', icon: Calendar }
      ]
    },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard, current: location.pathname.includes('/admin/payments') },
    { name: 'Reviews', href: '/admin/reviews', icon: Star, current: location.pathname.includes('/admin/reviews') },
    { name: 'Activity Log', href: '/admin/activity-log', icon: Bell, current: location.pathname.includes('/admin/activity-log') },
    { name: 'Discounts', href: '/admin/discounts', icon: Percent, current: location.pathname.includes('/admin/discounts') },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, current: location.pathname.includes('/admin/analytics') },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: location.pathname.includes('/admin/settings') },
    { name: 'Social Keys', href: '/admin/social-keys', icon: Settings, current: location.pathname.includes('/admin/social-keys') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex flex-shrink-0 items-center px-4 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {siteSettings.logo_admin ? (
                  <img 
                    src={siteSettings.logo_admin} 
                    alt={siteSettings.site_name} 
                    className="h-8 w-auto"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SM</span>
                  </div>
                )}
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">SportMeet</h1>
                <p className="text-sm text-gray-500">Admin Panel</p>
              </div>
            </div>
          </div>
          <div className="mt-5 h-0 flex-1 overflow-y-auto">
            <nav className="space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedMenus[item.name];
                
                if (hasChildren) {
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`${
                          item.current
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center justify-between w-full px-2 py-2 text-sm font-medium border-l-4`}
                      >
                        <div className="flex items-center">
                          <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          {item.name}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="ml-4 space-y-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const hasGrandChildren = child.children && child.children.length > 0;
                            const isChildExpanded = expandedMenus[child.name];
                            
                            if (hasGrandChildren) {
                              return (
                                <div key={child.name}>
                                  <button
                                    onClick={() => toggleMenu(child.name)}
                                    className="flex items-center justify-between w-full px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                  >
                                    <div className="flex items-center">
                                      <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                      {child.name}
                                    </div>
                                    {isChildExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                  {isChildExpanded && (
                                    <div className="ml-4 space-y-1">
                                      {child.children.map((grandChild) => {
                                        const GrandChildIcon = grandChild.icon;
                                        return (
                                          <Link
                                            key={grandChild.name}
                                            to={grandChild.href}
                                            className="flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                          >
                                            <GrandChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                            {grandChild.name}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <Link
                                  key={child.name}
                                  to={child.href}
                                  className="flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                  <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                  {child.name}
                                </Link>
                              );
                            }
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        item.current
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium border-l-4`}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                }
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {siteSettings.logo_admin ? (
                    <img 
                      src={siteSettings.logo_admin} 
                      alt={siteSettings.site_name} 
                      className="h-10 w-auto"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">SM</span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">{siteSettings.site_name}</h1>
                  <p className="text-sm text-gray-500">Admin Panel</p>
                </div>
              </div>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedMenus[item.name];
                
                if (hasChildren) {
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`${
                          item.current
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center justify-between w-full px-2 py-2 text-sm font-medium border-l-4 transition-colors duration-200`}
                      >
                        <div className="flex items-center">
                          <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          {item.name}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="ml-4 space-y-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const hasGrandChildren = child.children && child.children.length > 0;
                            const isChildExpanded = expandedMenus[child.name];
                            
                            if (hasGrandChildren) {
                              return (
                                <div key={child.name}>
                                  <button
                                    onClick={() => toggleMenu(child.name)}
                                    className="flex items-center justify-between w-full px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                  >
                                    <div className="flex items-center">
                                      <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                      {child.name}
                                    </div>
                                    {isChildExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                  {isChildExpanded && (
                                    <div className="ml-4 space-y-1">
                                      {child.children.map((grandChild) => {
                                        const GrandChildIcon = grandChild.icon;
                                        return (
                                          <Link
                                            key={grandChild.name}
                                            to={grandChild.href}
                                            className="flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                          >
                                            <GrandChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                            {grandChild.name}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <Link
                                  key={child.name}
                                  to={child.href}
                                  className="flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                  <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                  {child.name}
                                </Link>
                              );
                            }
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        item.current
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors duration-200`}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                }
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b border-gray-200">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-end px-4">
            <div className="flex items-center md:ml-6">
              {/* Notifications */}
              <button
                type="button"
                className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">{user?.first_name || 'Admin'}</span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <a
                      href="/admin/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </a>
                    <a
                      href="/admin/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </a>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
