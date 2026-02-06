import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Phone, Mail, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("my-bookings");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allBookings = await base44.entities.Booking.filter({});
      
      setBookings(allBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await base44.entities.Booking.update(bookingId, { status });
      toast.success(`Booking ${status}`);
      loadData();
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

  const myBookings = bookings.filter(b => b.created_by === user?.email);
  const receivedBookings = bookings.filter(b => b.service_provider_email === user?.email);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800"
  };

  const BookingCard = ({ booking, isProvider }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.listing_title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Booking ID: {booking.id.slice(0, 8)}
            </p>
          </div>
          <Badge className={statusColors[booking.status]}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{format(new Date(booking.booking_date), "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{booking.booking_time} ({booking.duration} min)</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{booking.customer_phone}</span>
          </div>
          {booking.customer_email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{booking.customer_email}</span>
            </div>
          )}
        </div>

        {booking.service_details && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Service:</p>
              <p className="text-gray-600">{booking.service_details}</p>
            </div>
          </div>
        )}

        {booking.additional_notes && (
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Notes:</p>
            <p className="text-gray-600">{booking.additional_notes}</p>
          </div>
        )}

        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Price:</span>
            <span className="text-xl font-bold text-blue-600">RM {booking.total_price}</span>
          </div>
        </div>

        {isProvider && booking.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => updateBookingStatus(booking.id, "confirmed")}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm
            </Button>
            <Button
              onClick={() => updateBookingStatus(booking.id, "cancelled")}
              variant="outline"
              className="flex-1 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        )}

        {isProvider && booking.status === "confirmed" && (
          <Button
            onClick={() => updateBookingStatus(booking.id, "completed")}
            className="w-full"
          >
            Mark as Completed
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600 mt-2">Manage your service bookings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-bookings">
            My Bookings ({myBookings.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            Received Requests ({receivedBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-bookings">
          {myBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No bookings yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Browse services and make your first booking
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {myBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} isProvider={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received">
          {receivedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No booking requests yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Customers will see your services and can book them
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {receivedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} isProvider={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}