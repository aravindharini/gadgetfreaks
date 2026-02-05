import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Package,
  Plus,
  Edit,
  Eye,
  MessageCircle,
  TrendingUp,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditListingSheet from "@/components/seller/EditListingSheet";
import { toast } from "sonner";

export default function MyListings() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [editingListing, setEditingListing] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['myMessages'],
    queryFn: () => base44.entities.Message.filter({ recipient_email: user?.email }, '-created_date', 100),
    enabled: !!user,
  });

  const getFilteredListings = () => {
    if (activeTab === "all") return listings;
    return listings.filter(l => l.status === activeTab);
  };

  const getListingStats = (listingId) => {
    const listingMessages = messages.filter(m => m.listing_id === listingId);
    const listing = listings.find(l => l.id === listingId);
    return {
      messages: listingMessages.length,
      views: listing?.views || 0
    };
  };

  const updateListingStatus = async (listingId, newStatus) => {
    try {
      await base44.entities.Listing.update(listingId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      toast.success(`Listing marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Failed to update listing");
    }
  };

  const deleteListing = async (listingId) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      await base44.entities.Listing.delete(listingId);
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      toast.success("Listing deleted");
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  const statusConfig = {
    active: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", label: "Active" },
    sold: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50", label: "Sold" },
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Pending" },
    removed: { icon: XCircle, color: "text-gray-600", bg: "bg-gray-50", label: "Removed" }
  };

  const filteredListings = getFilteredListings();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to manage your listings</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
              <p className="text-gray-600">Manage your products</p>
            </div>
          </div>
          <Link to={createPageUrl("Sell")}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Listings</p>
                  <p className="text-2xl font-bold">{listings.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {listings.filter(l => l.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold">
                    {listings.reduce((sum, l) => sum + (l.views || 0), 0)}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Messages</p>
                  <p className="text-2xl font-bold">{messages.length}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({listings.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({listings.filter(l => l.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="sold">Sold ({listings.filter(l => l.status === 'sold').length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({listings.filter(l => l.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="removed">Removed ({listings.filter(l => l.status === 'removed').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                  <p className="text-gray-600 mb-6">Start selling by creating your first listing</p>
                  <Link to={createPageUrl("Sell")}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredListings.map((listing) => {
                  const stats = getListingStats(listing.id);
                  const StatusIcon = statusConfig[listing.status].icon;
                  
                  return (
                    <Card key={listing.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Link to={createPageUrl(`Listing?id=${listing.id}`)} className="flex-shrink-0">
                            <img
                              src={listing.images?.[0] || "https://via.placeholder.com/150"}
                              alt={listing.title}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          </Link>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <Link to={createPageUrl(`Listing?id=${listing.id}`)}>
                                  <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 mb-1">
                                    {listing.title}
                                  </h3>
                                </Link>
                                <p className="text-xl font-bold text-blue-600 mb-2">
                                  RM{listing.price?.toLocaleString()}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{stats.views} views</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{stats.messages} messages</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <Badge className={`${statusConfig[listing.status].bg} ${statusConfig[listing.status].color} border-0`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig[listing.status].label}
                                </Badge>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingListing(listing)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    {listing.status === 'active' && (
                                      <>
                                        <DropdownMenuItem onClick={() => updateListingStatus(listing.id, 'sold')}>
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Mark as Sold
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateListingStatus(listing.id, 'removed')}>
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Remove
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {listing.status !== 'active' && (
                                      <DropdownMenuItem onClick={() => updateListingStatus(listing.id, 'active')}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark as Active
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => deleteListing(listing.id)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {editingListing && (
        <EditListingSheet
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['myListings'] });
            setEditingListing(null);
          }}
        />
      )}
    </div>
  );
}