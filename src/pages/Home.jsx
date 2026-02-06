
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Listing } from "@/entities/Listing";
import { Search, ArrowRight, Shield, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "../components/marketplace/ListingCard";
import CategoryGrid from "../components/marketplace/CategoryGrid";
import FeaturedSection from "../components/marketplace/FeaturedSection";

export default function Home() {
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await Listing.list("-created_date", 8);
      const activeListings = data.filter(listing => listing.status === 'active');
      setListings(activeListings);
    } catch (error) {
      console.error("Error loading listings:", error);
    }
    setIsLoading(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = createPageUrl(`Browse?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-emerald-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Buy & Sell 
              <span className="block bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Electronics Safely
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The trusted marketplace for pre-owned smartphones, tablets, and gadgets. 
              Verified sellers, guaranteed quality.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-2 bg-white rounded-2xl shadow-lg p-2">
                <Input
                  placeholder="Search for iPhone, Samsung, MacBook..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="border-0 text-lg bg-transparent focus-visible:ring-0"
                />
                <Button 
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Verified Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-600" />
                <span>Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span>Best Prices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-lg text-gray-600">Find exactly what you're looking for</p>
        </div>
        <CategoryGrid />
      </section>

      {/* Featured Listings */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedSection />
        </div>
      </section>

      {/* Recent Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Listings</h2>
            <p className="text-gray-600">Fresh deals just posted</p>
          </div>
          <Link to={createPageUrl("Browse")}>
            <Button variant="outline" className="gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start selling?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            List your device in minutes and reach thousands of verified buyers
          </p>
          <Link to={createPageUrl("Sell")}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
              Start Selling Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
