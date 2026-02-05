import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cart } from "@/entities/Cart";
import { User } from "@/entities/User";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShoppingCart, Heart } from "lucide-react";
import { toast } from "sonner";

const conditionColors = {
  mint: "bg-emerald-100 text-emerald-800 border-emerald-200",
  excellent: "bg-blue-100 text-blue-800 border-blue-200", 
  good: "bg-green-100 text-green-800 border-green-200",
  fair: "bg-yellow-100 text-yellow-800 border-yellow-200",
  poor: "bg-red-100 text-red-800 border-red-200"
};

export default function ListingCard({ listing }) {
  const [addingToCart, setAddingToCart] = useState(false);
  const primaryImage = listing.images?.[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop";

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
      {/* Image */}
      <Link to={createPageUrl(`Listing?id=${listing.id}`)}>
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
          <img
            src={primaryImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {listing.featured && (
            <Badge className="absolute top-3 left-3 bg-orange-500 text-white border-0">
              Featured
            </Badge>
          )}
          <Badge 
            className={`absolute top-3 right-3 border ${conditionColors[listing.condition] || conditionColors.good}`}
          >
            {listing.condition}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        <Link to={createPageUrl(`Listing?id=${listing.id}`)}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {listing.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <span className="capitalize">{listing.brand}</span>
            {listing.model && (
              <>
                <span>•</span>
                <span>{listing.model}</span>
              </>
            )}
          </div>
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-gray-900">
            RM{listing.price?.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Verified</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={addToCart}
            disabled={addingToCart || listing.status !== "active"}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {addingToCart ? "Adding..." : "Add to Cart"}
          </Button>
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}