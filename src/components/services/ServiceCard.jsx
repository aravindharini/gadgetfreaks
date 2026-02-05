import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, Navigation } from "lucide-react";

export default function ServiceCard({ listing }) {
  const primaryImage = listing.images?.[0] || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop";

  const openInMaps = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (listing.latitude && listing.longitude) {
      window.open(`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`, '_blank');
    } else if (listing.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`, '_blank');
    }
  };

  const serviceTypeColors = {
    hospital: "bg-red-100 text-red-800 border-red-200",
    clinic: "bg-blue-100 text-blue-800 border-blue-200",
    hotel: "bg-purple-100 text-purple-800 border-purple-200",
    restaurant: "bg-orange-100 text-orange-800 border-orange-200",
    cafe: "bg-amber-100 text-amber-800 border-amber-200",
    shopping_mall: "bg-pink-100 text-pink-800 border-pink-200",
    repair: "bg-indigo-100 text-indigo-800 border-indigo-200",
    consultation: "bg-green-100 text-green-800 border-green-200",
    other: "bg-gray-100 text-gray-800 border-gray-200"
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={createPageUrl(`Listing?id=${listing.id}`)}>
        <div className="aspect-[16/9] bg-gray-100 overflow-hidden relative">
          <img
            src={primaryImage}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {listing.featured && (
              <Badge className="bg-orange-500 text-white border-0">
                Featured
              </Badge>
            )}
            {listing.service_type && (
              <Badge className={`border ${serviceTypeColors[listing.service_type] || serviceTypeColors.other}`}>
                {listing.service_type}
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="p-5">
        <Link to={createPageUrl(`Listing?id=${listing.id}`)}>
          <h3 className="font-bold text-lg text-gray-900 mb-2 hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {listing.description}
          </p>
        </Link>

        <div className="space-y-2 mb-4">
          {listing.contact_phone && (
            <div className="flex items-start gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <a href={`tel:${listing.contact_phone}`} className="text-gray-700 hover:text-blue-600">
                {listing.contact_phone}
              </a>
            </div>
          )}

          {listing.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 line-clamp-2">{listing.address}</span>
            </div>
          )}

          {listing.operating_hours && (
            <div className="flex items-start gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{listing.operating_hours}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {(listing.latitude || listing.address) && (
            <Button 
              onClick={openInMaps}
              variant="outline"
              className="flex-1"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Directions
            </Button>
          )}
          
          {listing.contact_phone && (
            <Button 
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `tel:${listing.contact_phone}`;
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}