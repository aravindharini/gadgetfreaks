import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  Edit, 
  Trash2, 
  Plus,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProviderServiceListings({ onUpdate }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const user = await base44.auth.me();
      const allListings = await base44.entities.Listing.filter({
        created_by: user.email,
        category: "services"
      });
      
      allListings.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setListings(allListings);
    } catch (error) {
      console.error("Error loading listings:", error);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const toggleListingStatus = async (listingId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "removed" : "active";
      await base44.entities.Listing.update(listingId, { status: newStatus });
      toast.success(`Service ${newStatus === "active" ? "activated" : "deactivated"}`);
      loadListings();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update service");
    }
  };

  const deleteListing = async (listingId) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    try {
      await base44.entities.Listing.delete(listingId);
      toast.success("Service deleted");
      loadListings();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    removed: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800"
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Service Listings</h2>
        <Link to={createPageUrl("Sell")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </Link>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No services yet</p>
            <Link to={createPageUrl("Sell")}>
              <Button>Create Your First Service</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Image */}
                  {listing.images?.[0] && (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{listing.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {listing.description}
                        </p>
                      </div>
                      <Badge className={statusColors[listing.status]}>
                        {listing.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      {listing.service_type && (
                        <span className="capitalize">{listing.service_type.replace('_', ' ')}</span>
                      )}
                      {listing.price && (
                        <span className="font-semibold text-gray-900">RM {listing.price}</span>
                      )}
                      <span>{listing.views || 0} views</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link to={`${createPageUrl("Listing")}?id=${listing.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleListingStatus(listing.id, listing.status)}
                      >
                        {listing.status === "active" ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => deleteListing(listing.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}