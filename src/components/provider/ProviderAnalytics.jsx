import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Loader2, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProviderAnalytics() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [analytics, setAnalytics] = useState({
    bookingsOverTime: [],
    popularServices: [],
    customerStats: [],
    revenueByMonth: [],
    conversionRate: 0,
    totalViews: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const user = await base44.auth.me();
      
      // Fetch all bookings for this provider
      const allBookings = await base44.entities.Booking.filter({
        service_provider_email: user.email
      });

      // Fetch provider's listings
      const providerListings = await base44.entities.Listing.filter({
        created_by: user.email,
        category: "services"
      });

      setBookings(allBookings);
      setListings(providerListings);

      // Calculate analytics
      calculateBookingsOverTime(allBookings);
      calculatePopularServices(allBookings);
      calculateCustomerDemographics(allBookings);
      calculateRevenueByMonth(allBookings);
      calculateConversionRate(allBookings, providerListings);

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBookingsOverTime = (bookings) => {
    const last3Months = subMonths(new Date(), 3);
    const dailyBookings = {};

    // Initialize all days with 0
    eachDayOfInterval({
      start: last3Months,
      end: new Date()
    }).forEach(day => {
      const key = format(day, 'MMM dd');
      dailyBookings[key] = 0;
    });

    // Count bookings per day
    bookings.forEach(booking => {
      const date = new Date(booking.booking_date);
      if (date >= last3Months) {
        const key = format(date, 'MMM dd');
        if (dailyBookings[key] !== undefined) {
          dailyBookings[key]++;
        }
      }
    });

    // Convert to array and sample every 7th day for readability
    const data = Object.entries(dailyBookings).map(([date, count]) => ({
      date,
      bookings: count
    })).filter((_, index) => index % 7 === 0);

    setAnalytics(prev => ({ ...prev, bookingsOverTime: data }));
  };

  const calculatePopularServices = (bookings) => {
    const serviceCounts = {};
    
    bookings.forEach(booking => {
      const service = booking.service_details || booking.listing_title;
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });

    const data = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setAnalytics(prev => ({ ...prev, popularServices: data }));
  };

  const calculateCustomerDemographics = (bookings) => {
    // Group by customer to avoid duplicates
    const uniqueCustomers = new Map();
    bookings.forEach(booking => {
      if (!uniqueCustomers.has(booking.customer_email)) {
        uniqueCustomers.set(booking.customer_email, booking);
      }
    });

    // For demo purposes, categorize by booking frequency
    const newCustomers = Array.from(uniqueCustomers.values()).filter(c => {
      const customerBookings = bookings.filter(b => b.customer_email === c.customer_email);
      return customerBookings.length === 1;
    }).length;

    const returningCustomers = Array.from(uniqueCustomers.values()).filter(c => {
      const customerBookings = bookings.filter(b => b.customer_email === c.customer_email);
      return customerBookings.length > 1;
    }).length;

    const data = [
      { name: 'New Customers', value: newCustomers },
      { name: 'Returning Customers', value: returningCustomers }
    ];

    setAnalytics(prev => ({ ...prev, customerStats: data }));
  };

  const calculateRevenueByMonth = (bookings) => {
    const monthlyRevenue = {};
    
    bookings.forEach(booking => {
      if (booking.payment_status === 'paid') {
        const month = format(new Date(booking.booking_date), 'MMM yyyy');
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + booking.total_price;
      }
    });

    const data = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .slice(-6);

    setAnalytics(prev => ({ ...prev, revenueByMonth: data }));
  };

  const calculateConversionRate = (bookings, listings) => {
    const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
    const totalBookings = bookings.length;
    const conversionRate = totalViews > 0 ? ((totalBookings / totalViews) * 100).toFixed(1) : 0;

    setAnalytics(prev => ({ 
      ...prev, 
      conversionRate: parseFloat(conversionRate),
      totalViews 
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              RM {bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_price, 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Paid bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Views to bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unique Customers</CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(bookings.map(b => b.customer_email)).size}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.bookingsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.popularServices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.customerStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.customerStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `RM ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue (MYR)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}