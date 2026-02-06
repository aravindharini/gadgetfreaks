import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Listing } from "@/entities/Listing";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User as UserIcon, 
  Package, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Plus,
  Edit,
  Eye,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  Calendar,
  LogOut,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ListingCard from "../components/marketplace/ListingCard";
import WhatsAppConnect from "../components/support/WhatsAppConnect";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    phone: "",
    location: "",
    bio: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      setProfileData({
        phone: userData.phone || "",
        location: userData.location || "",
        bio: userData.bio || ""
      });
      
      const listings = await Listing.filter({ created_by: userData.email }, "-created_date");
      setMyListings(listings);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setIsLoading(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // Create a new object with only non-empty fields
    const dataToUpdate = Object.entries(profileData).reduce((acc, [key, value]) => {
        if (value) {
            acc[key] = value;
        }
        return acc;
    }, {});
    
    try {
      await User.updateMyUserData(dataToUpdate);
      toast.success("Profile updated successfully!");
      setIsEditSheetOpen(false);
      // Reload user data to reflect changes
      await loadUserData(); 
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
    setIsUpdating(false);
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      toast.success("You have been logged out.");
      window.location.href = createPageUrl("Home");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleImportGooglePlaces = async () => {
    if (!user || user.role !== 'admin') {
      toast.error("Admin access required");
      return;
    }

    setIsImporting(true);
    try {
      const response = await base44.functions.invoke('importGooglePlaces', {
        location: "Malaysia",
        types: ["hospital", "doctor", "night_club", "bar", "lodging"]
      });

      if (response.success) {
        toast.success(`Successfully imported ${response.imported} establishments!`);
        await loadUserData();
      } else {
        toast.error(response.error || "Import failed");
      }
    } catch (error) {
      console.error("Error importing places:", error);
      toast.error("Failed to import establishments");
    }
    setIsImporting(false);
  };

  const getFilteredListings = () => {
    if (activeTab === "all") return myListings;
    return myListings.filter(listing => listing.status === activeTab);
  };

  const getListingStats = () => {
    const active = myListings.filter(l => l.status === "active").length;
    const sold = myListings.filter(l => l.status === "sold").length;
    const total = myListings.length;
    const totalValue = myListings
      .filter(l => l.status === "active")
      .reduce((sum, l) => sum + (l.price || 0), 0);
    
    return { active, sold, total, totalValue };
  };

  if (isLoading && !user) { // adjusted isLoading check
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-white rounded-2xl h-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-24"></div>
              ))}
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
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Please Login</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to view your profile</p>
            <Button onClick={() => User.login()}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getListingStats();
  const filteredListings = getFilteredListings();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                <AvatarFallback className="text-2xl">
                  {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {user.full_name || 'User'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{user.location}</span>
                        </div>
                      )}
                    </div>
                    {user.rating != null && ( // Check for null/undefined instead of truthy
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{user.rating.toFixed(1)}</span>
                        </div>
                        {user.total_sales > 0 && (
                          <span className="text-sm text-gray-500">
                            • {user.total_sales} sales
                          </span>
                        )}
                        {user.verified && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            Verified
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Edit Profile</SheetTitle>
                        </SheetHeader>
                        <form onSubmit={handleProfileUpdate} className="mt-6 space-y-6">
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              className="mt-1"
                              placeholder="Your contact number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={profileData.location}
                              onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                              className="mt-1"
                              placeholder="e.g., Kuala Lumpur, Malaysia"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                              id="bio"
                              value={profileData.bio}
                              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                              className="mt-1"
                              placeholder="Tell us a little about yourself"
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <SheetClose asChild>
                              <Button type="button" variant="outline">Cancel</Button>
                            </SheetClose>
                            <Button type="submit" disabled={isUpdating}>
                              {isUpdating ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </SheetContent>
                    </Sheet>

                    <Link to={createPageUrl("Sell")}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Listing
                      </Button>
                    </Link>

                    {user.role === 'admin' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleImportGooglePlaces}
                        disabled={isImporting}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isImporting ? "Importing..." : "Import Places"}
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
                
                {user.bio && (
                  <p className="text-gray-600 mt-3">{user.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Connect */}
        <div className="mb-8">
          <WhatsAppConnect />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Listings</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold">{stats.sold}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Value</p>
                  <p className="text-2xl font-bold">RM{stats.totalValue.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Member Since</p>
                  <p className="text-2xl font-bold">
                    {new Date(user.created_date).getFullYear()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              My Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="sold">Sold ({stats.sold})</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                {filteredListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No {activeTab === "all" ? "" : activeTab} listings
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {activeTab === "all" 
                        ? "Start selling by creating your first listing"
                        : `You don't have any ${activeTab} listings yet`
                      }
                    </p>
                    {activeTab === "all" && (
                      <Link to={createPageUrl("Sell")}>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Listing
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => (
                      <div key={listing.id} className="relative">
                        <ListingCard listing={listing} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Listing
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}