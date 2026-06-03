import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign,
  Eye,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalytics({
        overview: {
          totalRevenue: 125430,
          totalBookings: 3421,
          totalUsers: 1247,
          totalVenues: 89,
          revenueGrowth: 22.5,
          bookingGrowth: 15.3,
          userGrowth: 12.8,
          venueGrowth: 8.2
        },
        revenueData: [
          { month: 'Jan', revenue: 4500, bookings: 120 },
          { month: 'Feb', revenue: 5200, bookings: 150 },
          { month: 'Mar', revenue: 6100, bookings: 180 },
          { month: 'Apr', revenue: 7800, bookings: 220 },
          { month: 'May', revenue: 9200, bookings: 280 },
          { month: 'Jun', revenue: 10800, bookings: 320 },
          { month: 'Jul', revenue: 12500, bookings: 380 },
          { month: 'Aug', revenue: 14200, bookings: 420 },
          { month: 'Sep', revenue: 15800, bookings: 450 },
          { month: 'Oct', revenue: 17200, bookings: 480 },
          { month: 'Nov', revenue: 18900, bookings: 520 },
          { month: 'Dec', revenue: 21000, bookings: 580 }
        ],
        userMetrics: {
          newUsers: 156,
          returningUsers: 891,
          activeUsers: 892,
          churnRate: 3.2,
          averageSessionDuration: '24m 32s',
          pageViews: 45678
        },
        venueMetrics: {
          totalVenues: 89,
          activeVenues: 76,
          newVenues: 8,
          averageRating: 4.6,
          totalReviews: 1247,
          topCategories: [
            { name: 'Tennis', count: 23, percentage: 25.8 },
            { name: 'Basketball', count: 18, percentage: 20.2 },
            { name: 'Swimming', count: 15, percentage: 16.9 },
            { name: 'Football', count: 12, percentage: 13.5 },
            { name: 'Gym', count: 21, percentage: 23.6 }
          ]
        },
        bookingMetrics: {
          totalBookings: 3421,
          completedBookings: 3124,
          cancelledBookings: 297,
          averageBookingValue: 36.7,
          peakHours: ['6:00 PM', '7:00 PM', '8:00 PM'],
          popularDays: ['Saturday', 'Sunday', 'Friday']
        }
      });
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const overviewCards = [
    {
      title: 'Total Revenue',
      value: `$${analytics.overview?.totalRevenue?.toLocaleString() || 0}`,
      change: `+${analytics.overview?.revenueGrowth || 0}%`,
      changeType: 'positive',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Total Bookings',
      value: analytics.overview?.totalBookings?.toLocaleString() || 0,
      change: `+${analytics.overview?.bookingGrowth || 0}%`,
      changeType: 'positive',
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Total Users',
      value: analytics.overview?.totalUsers?.toLocaleString() || 0,
      change: `+${analytics.overview?.userGrowth || 0}%`,
      changeType: 'positive',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Total Venues',
      value: analytics.overview?.totalVenues?.toLocaleString() || 0,
      change: `+${analytics.overview?.venueGrowth || 0}%`,
      changeType: 'positive',
      icon: MapPin,
      color: 'green'
    }
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights into your platform performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                    <Icon className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {card.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.changeType === 'positive' ? (
                          <TrendingUp className="h-4 w-4 flex-shrink-0 self-center" />
                        ) : (
                          <TrendingDown className="h-4 w-4 flex-shrink-0 self-center" />
                        )}
                        <span className="sr-only">
                          {card.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                        </span>
                        {card.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +22.5% from last month
            </div>
          </div>
          <div className="h-64 flex items-end space-x-1">
            {analytics.revenueData?.map((item, index) => (
              <div key={item.month} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t-lg relative group">
                  <div 
                    className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500"
                    style={{ height: `${(item.revenue / 25000) * 100}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ${item.revenue.toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">{item.month}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">New Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.userMetrics?.newUsers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Returning Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.userMetrics?.returningUsers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600">Active Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.userMetrics?.activeUsers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-600">Avg Session Duration</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.userMetrics?.averageSessionDuration || '0m'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-indigo-500 mr-2" />
                <span className="text-sm text-gray-600">Page Views</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.userMetrics?.pageViews?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Venue Categories */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Venue Categories Distribution</h3>
        <div className="space-y-3">
          {analytics.venueMetrics?.topCategories?.map((category, index) => (
            <div key={category.name} className="flex items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <span className="text-sm text-gray-500">{category.count} venues</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{category.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Booking Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-lg font-semibold text-green-600">
                {analytics.bookingMetrics?.completedBookings || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cancelled</span>
              <span className="text-lg font-semibold text-red-600">
                {analytics.bookingMetrics?.cancelledBookings || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-semibold text-gray-900">
                {analytics.bookingMetrics?.totalBookings || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Peak Hours</h3>
          <div className="space-y-2">
            {analytics.bookingMetrics?.peakHours?.map((hour, index) => (
              <div key={index} className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">{hour}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Days</h3>
          <div className="space-y-2">
            {analytics.bookingMetrics?.popularDays?.map((day, index) => (
              <div key={index} className="flex items-center">
                <Calendar className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">{day}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
