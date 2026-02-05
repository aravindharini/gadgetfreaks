
import React, { useState, useEffect } from "react";
import { Cart } from "@/entities/Cart";
import { Listing } from "@/entities/Listing";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  Package,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [listings, setListings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      const cartData = await Cart.filter({ created_by: userData.email }, "-created_date");
      setCartItems(cartData);
      
      // Load listing details for each cart item
      const listingIds = cartData.map(item => item.listing_id);
      const listingPromises = listingIds.map(id => Listing.get(id));
      const listingData = await Promise.all(listingPromises);
      
      const listingsMap = {};
      listingData.forEach(listing => {
        listingsMap[listing.id] = listing;
      });
      setListings(listingsMap);
      
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart");
    }
    setIsLoading(false);
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }
    
    try {
      await Cart.update(cartItemId, { quantity: newQuantity });
      setCartItems(prev => 
        prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await Cart.delete(cartItemId);
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      toast.success("Removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => {
      const listing = listings[item.listing_id];
      return total + (listing?.price || 0) * (item.quantity || 1);
    }, 0);
  };

  const proceedToCheckout = () => {
    window.location.href = createPageUrl("Checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
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
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Please Login</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to view your cart</p>
            <Button onClick={() => User.login()}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          {cartItems.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
            <Link to={createPageUrl("Browse")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Package className="w-4 h-4 mr-2" />
                Browse Electronics
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((cartItem) => {
                const listing = listings[cartItem.listing_id];
                if (!listing) return null;

                const primaryImage = listing.images?.[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop";

                return (
                  <Card key={cartItem.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Image */}
                        <Link to={createPageUrl(`Listing?id=${listing.id}`)}>
                          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={primaryImage}
                              alt={listing.title}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={createPageUrl(`Listing?id=${listing.id}`)}
                            className="block hover:text-blue-600 transition-colors"
                          >
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                              {listing.title}
                            </h3>
                          </Link>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <span className="capitalize">{listing.brand}</span>
                            {listing.model && (
                              <>
                                <span>•</span>
                                <span>{listing.model}</span>
                              </>
                            )}
                            {listing.condition && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {listing.condition}
                                </Badge>
                              </>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-gray-900">
                              RM{listing.price?.toLocaleString()}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-8 h-8"
                                  onClick={() => updateQuantity(cartItem.id, (cartItem.quantity || 1) - 1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  value={cartItem.quantity || 1}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 1;
                                    updateQuantity(cartItem.id, newQuantity);
                                  }}
                                  className="w-16 text-center"
                                  min="1"
                                  type="number"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-8 h-8"
                                  onClick={() => updateQuantity(cartItem.id, (cartItem.quantity || 1) + 1)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Remove Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => removeFromCart(cartItem.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                      <span>RM{getTotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-emerald-600">Free</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>RM{getTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={proceedToCheckout}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                  </Button>

                  <Link to={createPageUrl("Browse")}>
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
