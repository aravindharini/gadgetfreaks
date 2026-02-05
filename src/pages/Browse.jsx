import React, { useState, useEffect, useCallback } from "react";
import { Listing } from "@/entities/Listing";
import { Search, Filter, Grid, List, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import ListingCard from "../components/marketplace/ListingCard";
import ServiceCard from "../components/services/ServiceCard";

export default function Browse() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState("-created_date");
  
  const [availableBrands, setAvailableBrands] = useState([]);

  // applyFilters is now wrapped in useCallback to ensure referential stability
  // This allows it to be a dependency in useEffect without causing infinite re-renders
  const applyFilters = useCallback(() => {
    let filtered = [...listings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Condition filter  
    if (selectedCondition !== "all") {
      filtered = filtered.filter(item => item.condition === selectedCondition);
    }

    // Brand filter
    if (selectedBrand !== "all") {
      filtered = filtered.filter(item => item.brand === selectedBrand);
    }

    // Price range filter
    filtered = filtered.filter(item => 
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );

    // Sort
    if (sortBy === "price_low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price_high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "-created_date") {
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === "created_date") {
      filtered.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else if (sortBy === "relevance") {
      // Sort by featured first, then by newest
      filtered.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });
    }

    setFilteredListings(filtered);
  }, [listings, searchQuery, selectedCategory, selectedCondition, selectedBrand, priceRange, sortBy]); // Dependencies for useCallback

  useEffect(() => {
    loadListings();
    
    // Get URL params
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category");
    const search = urlParams.get("search");
    
    if (category) setSelectedCategory(category);
    if (search) setSearchQuery(search);
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    // applyFilters is now a stable reference due to useCallback,
    // so it can be safely used as a dependency here.
    applyFilters();
  }, [applyFilters]); // Now correctly depends on the memoized applyFilters

  const loadListings = async () => {
    try {
      const data = await Listing.filter({ status: "active" }, "-created_date", 100);
      setListings(data);
      
      // Extract unique brands
      const brands = [...new Set(data.map(item => item.brand).filter(Boolean))];
      setAvailableBrands(brands.sort());
      
      // Calculate max price from listings
      const prices = data.map(item => item.price || 0);
      const calculatedMaxPrice = Math.max(...prices, 10000);
      setMaxPrice(calculatedMaxPrice);
      setPriceRange([0, calculatedMaxPrice]);
    } catch (error) {
      console.error("Error loading listings:", error);
    }
    setIsLoading(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedCondition("all");
    setSelectedBrand("all");
    setPriceRange([0, maxPrice]);
    setSortBy("-created_date");
  };

  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== "all" ? selectedCategory : null,
    selectedCondition !== "all" ? selectedCondition : null,
    selectedBrand !== "all" ? selectedBrand : null,
    priceRange[0] > 0 || priceRange[1] < maxPrice ? "price" : null
  ].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="smartphone">Smartphones</SelectItem>
            <SelectItem value="tablet">Tablets</SelectItem>
            <SelectItem value="laptop">Laptops</SelectItem>
            <SelectItem value="smartwatch">Smartwatches</SelectItem>
            <SelectItem value="headphones">Headphones</SelectItem>
            <SelectItem value="gaming">Gaming</SelectItem>
            <SelectItem value="camera">Cameras</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
            <SelectItem value="rentals">Rentals</SelectItem>
            <SelectItem value="services">Services</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {availableBrands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
        <Select value={selectedCondition} onValueChange={setSelectedCondition}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="mint">Mint</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="poor">Poor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range
        </label>
        <div className="flex items-center gap-2 mb-3">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
            className="w-24 text-sm"
            placeholder="Min"
          />
          <span className="text-gray-500">-</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || maxPrice])}
            className="w-24 text-sm"
            placeholder="Max"
          />
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={maxPrice}
          min={0}
          step={50}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>RM{priceRange[0]}</span>
          <span>RM{priceRange[1]}</span>
        </div>
      </div>

      <Button variant="outline" onClick={clearFilters} className="w-full">
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Electronics</h1>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
              </Badge>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-created_date">Newest First</SelectItem>
                    <SelectItem value="created_date">Oldest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              <FilterPanel />
            </div>
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="mb-6">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredListings.map((listing) => (
                  listing.category === "services" ? (
                    <ServiceCard key={listing.id} listing={listing} />
                  ) : (
                    <ListingCard key={listing.id} listing={listing} />
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}