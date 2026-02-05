import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  TrendingUp,
  DollarSign,
  Package,
  Eye,
  MessageCircle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SellerDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: listings = [] } = useQuery({
    queryKey: ['sellerListings'],
    queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['sellerOrders'],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.filter({}, '-created_date', 100);
      // Filter orders that contain items sold by this user
      return allOrders.filter(order => 
        order.items?.some(item => item.seller_email === user?.email)
      );
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['sellerMessages'],
    queryFn: () => base44.entities.Message.filter({ recipient_email: user?.email }, '-created_date', 100),
    enabled: !!user,
  });

  const calculateStats = () => {
    const activeListings = listings.filter(l => l.status === 'active').length;
    const soldListings = listings.filter(l => l.status === 'sold').length;
    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
    const totalRevenue = orders.reduce((sum, order) => {
      const userItems = order.items?.filter(item => item.seller_email === user?.email) || [];
      return sum + userItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

    return {
      activeListings,
      soldListings,
      totalViews,
      totalRevenue,
      totalMessages: messages.length,
      unreadMessages: messages.filter(m => !m.read).length,
      pendingOrders
    };
  };

  const getRecentActivity = () => {
    const activities = [];
    
    // Recent orders
    orders.slice(0, 5).forEach(order => {
      activities.push({
        type: 'order',
        date: order.created_date,
        message: `New order #${order.order_number}`,
        link: null
      });
    });

    // Recent messages
    messages.slice(0, 5).forEach(msg => {
      activities.push({
        type: 'message',
        date: msg.created_date,
        message: `Message about "${msg.listing_title}"`,
        link: createPageUrl("Messages")
      });
    });

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await base44.entities.Order.update(orderId, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your dashboard</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = calculateStats();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-gray-600">Track your sales performance</p>
            </div>
          </div>
          <Link to={createPageUrl("MyListings")}>
            <Button variant="outline">Manage Listings</Button>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-600 border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">RM{stats.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold">{stats.activeListings}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.soldListings} sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <Badge className="bg-purple-100 text-purple-600 border-0">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +8%
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold">{stats.totalViews}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-orange-600" />
                </div>
                {stats.unreadMessages > 0 && (
                  <Badge className="bg-red-500 text-white border-0">
                    {stats.unreadMessages} new
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">Messages</p>
              <p className="text-2xl font-bold">{stats.totalMessages}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-4 border-b last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'order' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {activity.type === 'order' ? (
                          <ShoppingCart className="w-4 h-4 text-green-600" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                        </p>
                      </div>
                      {activity.link && (
                        <Link to={activity.link}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pendingOrders === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending orders</p>
              ) : (
                <div className="space-y-4">
                  {orders
                    .filter(o => o.status === 'pending' || o.status === 'confirmed')
                    .slice(0, 5)
                    .map((order) => {
                      const userItems = order.items?.filter(item => item.seller_email === user?.email) || [];
                      const orderTotal = userItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      
                      return (
                        <div key={order.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">#{order.order_number}</p>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">RM{orderTotal.toLocaleString()}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                            >
                              Ship
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}