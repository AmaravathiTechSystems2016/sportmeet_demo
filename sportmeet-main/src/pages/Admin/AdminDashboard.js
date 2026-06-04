import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { coreAPI } from '../../services/api';
import {
  ArrowRight,
  Users, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Star,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import Card from '../../components/UI/Card';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AdminDashboard = () => {
  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery(
    'admin-dashboard-stats',
    coreAPI.getAdminDashboardStats,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading, error: activityError, refetch: refetchActivity } = useQuery(
    'admin-recent-activity',
    () => coreAPI.getAdminRecentActivity({ limit: 10 }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch top venues
  const { data: topVenuesData, isLoading: venuesLoading, error: venuesError, refetch: refetchTopVenues } = useQuery(
    'admin-top-venues',
    coreAPI.getAdminTopVenues,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    }
  );

  const loading = (statsLoading || activityLoading || venuesLoading) && !statsData && !activityData && !topVenuesData;
  const stats = statsData?.data || {};
  const recentActivity = Array.isArray(activityData?.data) ? activityData.data : [];
  const topVenues = Array.isArray(topVenuesData?.data) ? topVenuesData.data : [];
  const hasDashboardError = Boolean((statsError || activityError || venuesError) && !statsData && !activityData && !topVenuesData);
  const retryDashboard = () => {
    refetchStats();
    refetchActivity();
    refetchTopVenues();
  };

  const statCards = [
    {
      name: 'Total Users',
      value: (stats.users?.total || 0).toLocaleString(),
      change: undefined,
      changeType: undefined,
      icon: Users,
      iconClass: 'bg-primary-100 text-primary-600'
    },
    {
      name: 'Total Venues',
      value: (stats.venues?.total || 0).toLocaleString(),
      change: undefined,
      changeType: undefined,
      icon: MapPin,
      iconClass: 'bg-green-100 text-green-600'
    },
    {
      name: 'Total Bookings',
      value: (stats.bookings?.total || 0).toLocaleString(),
      change: undefined,
      changeType: undefined,
      icon: Calendar,
      iconClass: 'bg-teal-100 text-teal-600'
    },
    {
      name: 'Total Revenue',
      value: `$${(stats.revenue?.total || 0).toLocaleString()}`,
      change: undefined,
      changeType: undefined,
      icon: DollarSign,
      iconClass: 'bg-emerald-100 text-emerald-600'
    }
  ];

  const quickStats = [
    {
      name: 'Venue Owners',
      value: stats.users?.venue_owners || 0,
      icon: Activity,
      color: 'text-green-600'
    },
    {
      name: 'Pending Bookings',
      value: stats.bookings?.pending || 0,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      name: 'Average Rating',
      value: stats.reviews?.average_rating || 0,
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      name: 'Total Events',
      value: stats.events?.total || 0,
      icon: Calendar,
      color: 'text-primary-600'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-primary-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-lime-200">
              <Activity className="h-4 w-4" />
              Platform control center
            </p>
            <h1 className="text-3xl font-extrabold md:text-4xl">Dashboard Overview</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Monitor users, venues, bookings, events, payments, reviews, and operational activity across SportMeet.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/venues" className="btn btn-primary">Review Venues</Link>
            <Link to="/admin/settings" className="btn btn-on-dark">CMS Settings</Link>
          </div>
        </div>
      </div>

      {hasDashboardError && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">Some dashboard data could not load.</p>
                <p className="mt-1 text-sm text-amber-800">
                  The admin panel is still usable. Refresh the dashboard data after checking the backend server.
                </p>
              </div>
            </div>
            <button type="button" onClick={retryDashboard} className="btn btn-outline bg-white">
              Retry Dashboard
            </button>
          </div>
        </Card>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${stat.iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      {/* Growth badge intentionally removed as requested */}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="p-4">
              <div className="flex items-center">
                <Icon className={`h-8 w-8 ${stat.color}`} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {[
          { label: 'Manage Users', href: '/admin/users', icon: Users },
          { label: 'Approve Venues', href: '/admin/venues', icon: MapPin },
          { label: 'Review Bookings', href: '/admin/bookings', icon: Calendar },
          { label: 'CMS & Branding', href: '/admin/settings', icon: Activity },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.href} className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:bg-primary-50 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-gray-950">{item.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-primary-600 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              Live monthly summary
            </div>
          </div>
          
          {/* Chart Container - Fixed height */}
          <div className="relative flex-1 min-h-[400px]">
            {/* Chart Area */}
            <div className="h-64 flex items-end justify-between px-1 sm:px-2">
              {(stats.monthly_data || []).map((item, index) => {
                const maxRevenue = Math.max(...(stats.monthly_data || []).map(d => d.revenue), 1);
                const hasData = item.revenue > 0;
                return (
                  <div key={item.month} className="flex flex-col items-center flex-1 max-w-12 sm:max-w-16">
                    {/* Bar Container */}
                    <div className="w-full bg-gray-100 rounded-t-lg relative h-48 flex items-end">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          hasData 
                            ? 'bg-gradient-to-t from-primary-600 to-primary-400' 
                            : 'bg-gray-200'
                        }`}
                        style={{ 
                          height: hasData ? `${Math.max((item.revenue / maxRevenue) * 100, 5)}%` : '5%'
                        }}
                      />
                    </div>
                    
                    {/* Month and Value Labels */}
                    <div className="mt-3 text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1 truncate w-full">{item.month}</div>
                      <div className="text-xs font-semibold text-gray-900 truncate w-full">
                        ${item.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* No Data Message */}
            {(!stats.monthly_data || stats.monthly_data.length === 0 || stats.monthly_data.every(d => d.revenue === 0)) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <TrendingUp className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <Link 
              to="/admin/activity-log" 
              className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
            >
              View all
            </Link>
          </div>
          
          {/* Activity List - Fixed height with scroll */}
          <div className="flex-1 min-h-[400px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <Activity className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-3 text-sm font-semibold text-gray-700">No recent activity yet</p>
                    <p className="mt-1 text-xs text-gray-500">New bookings, users, venues, payments, and reviews will appear here.</p>
                  </li>
                )}
                {recentActivity.slice(0, 5).map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-6">
                      {activityIdx !== Math.min(recentActivity.length, 5) - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-white flex items-center justify-center ring-8 ring-white">
                            {getStatusIcon(activity.status)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 font-medium leading-5">{activity.message}</p>
                            {activity.user && (
                              <p className="text-xs text-gray-500 mt-1">by {activity.user}</p>
                            )}
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-gray-500 flex-shrink-0">
                            {activity.time_display || activity.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                
                {/* Show more indicator if there are more activities */}
                {recentActivity.length > 5 && (
                  <li>
                    <div className="relative">
                      <div className="flex items-center justify-center py-4">
                        <Link 
                          to="/admin/activity-log" 
                          className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                        >
                          View {recentActivity.length - 5} more activities
                          <ArrowRight className="ml-1 inline h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Venues */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Venues</h3>
          <Link to="/admin/venues" className="text-sm text-primary-600 hover:text-primary-500">
            View all venues
          </Link>
        </div>
        {topVenues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <MapPin className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-3 text-sm font-semibold text-gray-700">No venue performance data yet</p>
            <p className="mt-1 text-xs text-gray-500">Venues with confirmed bookings will appear in this table.</p>
          </div>
        ) : (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topVenues.map((venue, index) => (
                <tr key={venue.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {venue.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                        <div className="text-sm text-gray-500">{venue.city}, {venue.state}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {venue.bookings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${venue.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-900">{venue.rating}</span>
                      <span className="ml-1 text-xs text-gray-500">({venue.total_reviews} reviews)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      venue.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : venue.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
