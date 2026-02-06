import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Calendar, 
  Store, 
  TrendingUp, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "react-hot-toast";
import ProviderBookingsTable from "@/components/provider/ProviderBookingsTable";
import ProviderServiceListings from "@/components/provider/ProviderServiceListings";
import ProviderEarnings from "@/components/provider/ProviderEarnings";
import ProviderAnalytics from "@/components/provider/ProviderAnalytics";
import ProviderInsights from "@/components/provider/ProviderInsights";

export default function ServiceProviderDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalEarnings: 0,
    activeListings: 0
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get all bookings for this provider
      const bookings = await base44.entities.Booking.filter({
        service_provider_email: currentUser.email
      });

      // Get provider's service listings
      const listings = await base44.entities.Listing.filter({
        created_by: currentUser.email,
        category: "services"
      });

      // Calculate stats
      const pending = bookings.filter(b => b.status === "pending").length;
      const confirmed = bookings.filter(b => b.status === "confirmed").length;
      const paidBookings = bookings.filter(b => b.payment_status === "paid");
      const totalEarnings = paidBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const activeListings = listings.filter(l => l.status === "active").length;

      setStats({
        totalBookings: bookings.length,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        totalEarnings,
        activeListings
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Provider Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your bookings, services, and earnings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingBookings}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">RM {stats.totalEarnings.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Services</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeListings}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <ProviderBookingsTable onUpdate={loadDashboardData} />
          </TabsContent>

          <TabsContent value="services">
            <ProviderServiceListings onUpdate={loadDashboardData} />
          </TabsContent>

          <TabsContent value="earnings">
            <ProviderEarnings />
          </TabsContent>

          <TabsContent value="analytics">
            <ProviderAnalytics />
          </TabsContent>

          <TabsContent value="insights">
            <ProviderInsights />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}