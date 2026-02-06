import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle,
  Loader2,
  MessageCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ServiceProviderChat from "@/components/chat/ServiceProviderChat";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function ProviderBookingsTable({ onUpdate }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const user = await base44.auth.me();
      const allBookings = await base44.entities.Booking.filter({
        service_provider_email: user.email
      });
      
      // Sort by date descending
      allBookings.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
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
      loadBookings();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800"
  };

  const paymentStatusColors = {
    unpaid: "bg-gray-100 text-gray-800",
    paid: "bg-green-100 text-green-800",
    refunded: "bg-orange-100 text-orange-800"
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === "all") return true;
    return b.status === filter;
  });

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
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Bookings Grid */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No bookings found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{booking.listing_title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Customer: {booking.customer_name}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={statusColors[booking.status]}>
                      {booking.status}
                    </Badge>
                    <Badge className={paymentStatusColors[booking.payment_status || 'unpaid']}>
                      {booking.payment_status || 'unpaid'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{format(new Date(booking.booking_date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{booking.booking_time} ({booking.duration} min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${booking.customer_phone}`} className="text-blue-600 hover:underline">
                      {booking.customer_phone}
                    </a>
                  </div>
                  {booking.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${booking.customer_email}`} className="text-blue-600 hover:underline">
                        {booking.customer_email}
                      </a>
                    </div>
                  )}
                </div>

                {booking.service_details && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Service:</p>
                    <p className="text-gray-600">{booking.service_details}</p>
                  </div>
                )}

                {booking.additional_notes && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Notes:</p>
                    <p className="text-gray-600">{booking.additional_notes}</p>
                  </div>
                )}

                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">
                    RM {booking.total_price}
                  </span>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh]">
                        <ServiceProviderChat booking={booking} />
                      </DialogContent>
                    </Dialog>

                    {booking.status === "pending" && (
                      <>
                        <Button
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}

                    {booking.status === "confirmed" && (
                      <Button
                        onClick={() => updateBookingStatus(booking.id, "completed")}
                        size="sm"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}