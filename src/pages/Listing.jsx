import React, { useState, useEffect, useCallback } from "react";
import { Listing } from "@/entities/Listing";
import { Cart } from "@/entities/Cart";
import { User } from "@/entities/User";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  Shield,
  MapPin,
  Calendar,
  Smartphone,
  Package,
  Palette,
  HardDrive,
  Wifi,
  Gavel,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import ContactSellerSheet from "../components/messaging/ContactSellerSheet";
import BidSection from "../components/bidding/BidSection";

const conditionColors = {
  mint: "bg-emerald-100 text-emerald-800 border-emerald-200",
  excellent: "bg-blue-100 text-blue-800 border-blue-200", 
  good: "bg-green-100 text-green-800 border-green-200",
  fair: "bg-yellow-100 text-yellow-800 border-yellow-200",
  poor: "bg-red-100 text-red-800 border-red-200"
};

export default function ListingPage() {
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const loadListing = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const listingId = urlParams.get("id");
      
      if (!listingId) {
        navigate(createPageUrl("Browse"));
        return;
      }

      const listingData = await Listing.get(listingId);
      setListing(listingData);
      
      // Track view
      await Listing.update(listingId, { 
        views: (listingData.views || 0) + 1 
      });
    } catch (error) {
      console.error("Error loading listing:", error);
      navigate(createPageUrl("Browse"));
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const addToCart = async () => {
    setAddingToCart(true);
    try {
      const user = await User.me();
      
      // Check if item is already in cart
      const existingCartItems = await Cart.filter({ 
        listing_id: listing.id, 
        created_by: user.email 
      });
      
      if (existingCartItems.length > 0) {
        toast.info("Item already in cart");
      } else {
        await Cart.create({
          listing_id: listing.id,
          quantity: 1,
          added_date: new Date().toISOString()
        });
        toast.success("Added to cart!");
      }
    } catch (error) {
      if (error.message.includes("not authenticated")) {
        toast.error("Please login to add items to cart");
      } else {
        toast.error("Failed to add to cart");
      }
    }
    setAddingToCart(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-96 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-12 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h2>
          <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist</p>
          <Link to={createPageUrl("Browse")}>
            <Button>Browse Listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images?.length > 0 ? listing.images : [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border">
              <img
                src={images[selectedImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index 
                        ? "border-blue-500" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Listing Details */}
          <div className="space-y-6">
            <div>
              <div className="flex gap-2 mb-3">
                {listing.featured && (
                  <Badge className="bg-orange-500 text-white border-0">
                    Featured
                  </Badge>
                )}
                {listing.is_auction && (
                  <Badge className="bg-blue-500 text-white border-0">
                    <Gavel className="w-3 h-3 mr-1" />
                    Auction
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{listing.title}</h1>
              
              {listing.category !== 'services' && (
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={`border ${conditionColors[listing.condition] || conditionColors.good}`}>
                    {listing.condition} condition
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Listed {new Date(listing.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {listing.is_auction ? (
                <BidSection listing={listing} onBidPlaced={loadListing} />
              ) : (
                <>
                  {listing.category !== 'services' && (
                    <div className="text-4xl font-bold text-gray-900 mb-6">
                      RM{listing.price?.toLocaleString()}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    {listing.category === 'services' ? (
                      // Services: Show website link
                      listing.website ? (
                        <Button 
                          onClick={() => window.open(listing.website, '_blank', 'noopener,noreferrer')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
                        >
                          <Globe className="w-5 h-5 mr-2" />
                          Visit Website
                        </Button>
                      ) : (
                        <Button 
                          disabled
                          className="flex-1 h-12"
                        >
                          <Globe className="w-5 h-5 mr-2" />
                          No Website Available
                        </Button>
                      )
                    ) : (
                      // Regular products: Show add to cart
                      <>
                        <Button 
                          onClick={addToCart}
                          disabled={addingToCart || listing.status !== "active"}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {addingToCart ? "Adding..." : "Add to Cart"}
                        </Button>
                        <Button variant="outline" size="icon" className="h-12 w-12">
                          <Heart className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="icon" className="h-12 w-12">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Contact Seller - Hidden for services */}
                  {listing.category !== 'services' && (
                    <ContactSellerSheet listing={listing} />
                  )}
                </>
              )}
            </div>

            {/* Device Specifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {listing.brand && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{listing.brand}</span>
                    </div>
                  )}
                  
                  {listing.model && (
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{listing.model}</span>
                    </div>
                  )}
                  
                  {listing.storage && (
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">{listing.storage}</span>
                    </div>
                  )}
                  
                  {listing.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Color:</span>
                      <span className="font-medium">{listing.color}</span>
                    </div>
                  )}
                  
                  {listing.carrier && (
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Carrier:</span>
                      <span className="font-medium">{listing.carrier}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{listing.category}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description and Seller Info */}
        <div className={`grid grid-cols-1 gap-8 ${listing.category === 'services' ? '' : 'lg:grid-cols-3'}`}>
          <div className={listing.category === 'services' ? '' : 'lg:col-span-2'}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {listing.description || "No description provided."}
                </p>
                
                {listing.seller_notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                    <p className="text-gray-600">{listing.seller_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Seller Info - Hidden for services */}
          {listing.category !== 'services' && (
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.created_by}`} />
                      <AvatarFallback>S</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">Seller</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">5.0 rating</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span className="text-gray-600">Verified seller</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">25+ items sold</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Kuala Lumpur</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-4">
                    View Seller Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}