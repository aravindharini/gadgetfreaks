import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function ProviderEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0
  });

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const user = await base44.auth.me();
      
      // Get all bookings for this provider
      const bookings = await base44.entities.Booking.filter({
        service_provider_email: user.email
      });

      // Sort by date
      bookings.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setEarnings(bookings);

      // Calculate summary
      const paidBookings = bookings.filter(b => b.payment_status === "paid");
      const total = paidBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      
      const now = new Date();
      const thisMonth = paidBookings.filter(b => {
        const bookingDate = new Date(b.created_date);
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
      }).reduce((sum, b) => sum + (b.total_price || 0), 0);

      const pending = bookings
        .filter(b => b.payment_status === "unpaid" && b.status !== "cancelled")
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      setSummary({ total, thisMonth, pending });
    } catch (error) {
      console.error("Error loading earnings:", error);
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  RM {summary.total.toFixed(2)}
                </p>
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
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  RM {summary.thisMonth.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  RM {summary.pending.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No earnings yet
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{booking.listing_title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(booking.booking_date), "MMM dd, yyyy")} • {booking.customer_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">RM {booking.total_price}</p>
                    <Badge 
                      className={
                        booking.payment_status === "paid" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {booking.payment_status || "unpaid"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}