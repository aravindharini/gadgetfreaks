
import React, { useState, useEffect } from "react";
import { Listing } from "@/entities/Listing";
import { Star, TrendingUp, Award } from "lucide-react";
import ListingCard from "./ListingCard";

export default function FeaturedSection() {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedListings();
  }, []);

  const loadFeaturedListings = async () => {
    setIsLoading(true); // Set loading to true at the start of the fetch
    try {
      const data = await Listing.list("-created_date", 20); // Fetch up to 20 recent listings
      const activeFeatured = data.filter(listing => listing.featured && listing.status === 'active').slice(0, 4); // Filter for featured and active, then take the first 4
      setFeaturedListings(activeFeatured);
    } catch (error) {
      console.error("Error loading featured listings:", error);
    }
    setIsLoading(false); // Set loading to false after fetch completes (success or error)
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (featuredListings.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Deals</h2>
        <p className="text-gray-600">Hand-picked premium listings coming soon</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Deals</h2>
        <p className="text-lg text-gray-600">Hand-picked premium devices from verified sellers</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
