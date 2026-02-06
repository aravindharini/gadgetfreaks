import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createBookingCheckout } from "@/functions/createBookingCheckout";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Loader2, CreditCard } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function BookingSheet({ listing, trigger }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    booking_time: "",
    duration: 60,
    service_details: "",
    additional_notes: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate) {
      toast.error("Please select a booking date");
      return;
    }

    if (!formData.booking_time) {
      toast.error("Please select a time slot");
      return;
    }

    setLoading(true);

    try {
      const user = await base44.auth.me();

      // Calculate price (base price or custom)
      const totalPrice = listing.price || 100;

      const bookingData = {
        listing_id: listing.id,
        listing_title: listing.title,
        service_provider_email: listing.created_by,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: formData.booking_time,
        duration: formData.duration,
        service_details: formData.service_details || listing.services_offered?.[0] || "General service",
        additional_notes: formData.additional_notes,
        customer_name: formData.customer_name || user.full_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || user.email,
        total_price: totalPrice
      };

      // Create Stripe checkout session
      const { data: checkoutData } = await createBookingCheckout({ bookingData });

      if (checkoutData.url) {
        // Check if running in iframe (preview mode)
        if (window.self !== window.top) {
          toast.error("Payment checkout only works on published apps. Please publish your app to accept payments.");
          setLoading(false);
          return;
        }

        // Redirect to Stripe checkout
        window.location.href = checkoutData.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to create booking");
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Book {listing.title}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Select Date
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time
            </Label>
            <Select value={formData.booking_time} onValueChange={(value) => setFormData({...formData, booking_time: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({...formData, duration: parseInt(value)})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Details */}
          {listing.services_offered && listing.services_offered.length > 0 && (
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={formData.service_details} onValueChange={(value) => setFormData({...formData, service_details: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {listing.services_offered.map((service, idx) => (
                    <SelectItem key={idx} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                placeholder="e.g., +60123456789"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
              placeholder="Any special requests or information..."
              rows={3}
            />
          </div>

          {/* Price */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price:</span>
              <span className="text-2xl font-bold text-blue-600">
                RM {listing.price || 100}
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Payment
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-2">
            You'll be redirected to secure payment via Stripe
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}