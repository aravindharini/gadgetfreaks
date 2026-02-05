
import React, { useState, useEffect, useCallback } from "react";
import { Cart } from "@/entities/Cart";
import { Listing } from "@/entities/Listing";
import { Order } from "@/entities/Order";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Shield,
  Package,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [listings, setListings] = useState({});
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingData, setShippingData] = useState({
    full_name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    phone: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const loadCheckoutData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Pre-fill shipping data from user profile
      setShippingData(prev => ({
        ...prev,
        full_name: userData.full_name || "",
        phone: userData.phone || ""
      }));

      const cartData = await Cart.filter({ created_by: userData.email }, "-created_date");
      
      if (cartData.length === 0) {
        toast.error("Your cart is empty");
        navigate(createPageUrl("Cart"));
        return;
      }

      setCartItems(cartData);
      
      // Load listing details
      const listingIds = cartData.map(item => item.listing_id);
      const listingPromises = listingIds.map(id => Listing.get(id));
      const listingData = await Promise.all(listingPromises);
      
      const listingsMap = {};
      listingData.forEach(listing => {
        listingsMap[listing.id] = listing;
      });
      setListings(listingsMap);
      
    } catch (error) {
      console.error("Error loading checkout data:", error);
      toast.error("Failed to load checkout data");
      navigate(createPageUrl("Cart"));
    }
    setIsLoading(false);
  }, [navigate]); // Added navigate to useCallback dependencies

  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]); // Added loadCheckoutData to useEffect dependencies

  const getTotal = () => {
    return cartItems.reduce((total, item) => {
      const listing = listings[item.listing_id];
      return total + (listing?.price || 0) * (item.quantity || 1);
    }, 0);
  };

  const handleInputChange = (field, value) => {
    setShippingData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['full_name', 'address_line_1', 'city', 'state', 'postal_code', 'phone'];
    const missingFields = requiredFields.filter(field => !shippingData[field]?.trim());
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ').replace(/_/g, ' ')}`);
      return false;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Generate order number
      const orderNumber = `GF${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Prepare order items
      const orderItems = cartItems.map(cartItem => {
        const listing = listings[cartItem.listing_id];
        return {
          listing_id: cartItem.listing_id,
          title: listing.title,
          price: listing.price,
          quantity: cartItem.quantity || 1,
          seller_email: listing.created_by
        };
      });

      // Create order
      const orderData = {
        order_number: orderNumber,
        total_amount: getTotal(),
        status: "pending",
        items: orderItems,
        shipping_address: shippingData,
        payment_method: paymentMethod,
        notes: orderNotes
      };

      const order = await Order.create(orderData);

      // Clear cart
      const deletePromises = cartItems.map(item => Cart.delete(item.id));
      await Promise.all(deletePromises);

      // Update listing status to sold
      const updatePromises = cartItems.map(item => 
        Listing.update(item.listing_id, { status: "sold" })
      );
      await Promise.all(updatePromises);

      toast.success("Order placed successfully!");
      navigate(createPageUrl(`OrderConfirmation?order=${order.id}`));

    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      {Array(4).fill(0).map((_, j) => (
                        <div key={j} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 h-fit">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Please Login</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to checkout</p>
            <Button onClick={() => User.login()}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(createPageUrl("Cart"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600">Complete your purchase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={shippingData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={shippingData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address_line_1">Address Line 1 *</Label>
                  <Input
                    id="address_line_1"
                    placeholder="Street address"
                    value={shippingData.address_line_1}
                    onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    placeholder="Apartment, suite, etc."
                    value={shippingData.address_line_2}
                    onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      value={shippingData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="digital_wallet">Digital Wallet (GrabPay, Touch 'n Go)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any special instructions or notes..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="h-20"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cartItems.map((cartItem) => {
                    const listing = listings[cartItem.listing_id];
                    if (!listing) return null;

                    return (
                      <div key={cartItem.id} className="flex gap-3">
                        <img
                          src={listing.images?.[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=100&fit=crop"}
                          alt={listing.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
                          <p className="text-sm text-gray-500">
                            Qty: {cartItem.quantity || 1}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          RM{((listing.price || 0) * (cartItem.quantity || 1)).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>RM{getTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>RM0</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>RM{getTotal().toLocaleString()}</span>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                <Button 
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Place Order • RM{getTotal().toLocaleString()}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
