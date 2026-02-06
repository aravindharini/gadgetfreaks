import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Wishlist } from "@/entities/Wishlist";
import { Listing } from "@/entities/Listing";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function WishlistPage() {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [listings, setListings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const user = await User.me();
      const items = await Wishlist.filter({ created_by: user.email }, "-created_date");
      setWishlistItems(items);

      // Load listing details for each wishlist item
      const listingPromises = items.map(item => 
        Listing.get(item.listing_id).catch(() => null)
      );
      const listingData = await Promise.all(listingPromises);
      
      const listingsMap = {};
      listingData.forEach((listing, index) => {
        if (listing) {
          listingsMap[items[index].listing_id] = listing;
        }
      });
      setListings(listingsMap);
    } catch (error) {
      if (error.message?.includes("not authenticated")) {
        toast.error("Please login to view your wishlist");
        navigate(createPageUrl("Home"));
      } else {
        toast.error("Failed to load wishlist");
      }
    }
    setIsLoading(false);
  };

  const removeFromWishlist = async (wishlistId) => {
    try {
      await Wishlist.delete(wishlistId);
      setWishlistItems(prev => prev.filter(item => item.id !== wishlistId));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  const getPriceChange = (original, current) => {
    if (!original || !current) return null;
    const diff = current - original;
    const percentChange = ((diff / original) * 100).toFixed(1);
    return { diff, percentChange };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-200 h-80 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          </div>
          <p className="text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding items you love to keep track of them</p>
            <Button onClick={() => navigate(createPageUrl("Browse"))}>
              Browse Listings
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => {
              const listing = listings[item.listing_id];
              if (!listing) return null;

              const priceChange = getPriceChange(item.original_price, listing.price);
              const isAvailable = listing.status === "active";

              return (
                <Card 
                  key={item.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(createPageUrl("Listing") + `?id=${listing.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={listing.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}
                        alt={listing.title}
                        className="w-full h-48 object-cover"
                      />
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="destructive" className="text-lg px-4 py-2">
                            No Longer Available
                          </Badge>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWishlist(item.id);
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {listing.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        {listing.brand && (
                          <Badge variant="outline" className="text-xs">
                            {listing.brand}
                          </Badge>
                        )}
                        {listing.condition && (
                          <Badge variant="secondary" className="text-xs">
                            {listing.condition}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            RM {listing.price?.toLocaleString()}
                          </span>
                        </div>

                        {priceChange && priceChange.diff !== 0 && (
                          <div className={`flex items-center gap-1 text-sm ${
                            priceChange.diff < 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {priceChange.diff < 0 ? (
                              <>
                                <TrendingDown className="w-4 h-4" />
                                <span>RM {Math.abs(priceChange.diff).toLocaleString()} ({priceChange.percentChange}%) cheaper</span>
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-4 h-4" />
                                <span>RM {priceChange.diff.toLocaleString()} ({priceChange.percentChange}%) more</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {isAvailable && listing.category !== "services" && (
                        <Button
                          className="w-full mt-4 gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(createPageUrl("Listing") + `?id=${listing.id}`);
                          }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}