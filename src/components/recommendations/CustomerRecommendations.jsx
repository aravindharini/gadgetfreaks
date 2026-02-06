import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CustomerRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getCustomerRecommendations', {});
      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((listing) => (
          <Card key={listing.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{listing.title}</CardTitle>
                {listing.confidence > 0.8 && (
                  <Badge className="bg-purple-100 text-purple-700">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Top Pick
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {listing.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{listing.address}</span>
                </div>
              )}
              
              <div className="bg-purple-50 p-3 rounded-lg text-sm text-gray-700">
                <p className="font-medium text-purple-900 mb-1">Why we recommend this:</p>
                <p className="text-xs">{listing.reason}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-green-600">
                  RM {listing.price}
                </span>
                <Link to={createPageUrl(`Listing?id=${listing.id}`)}>
                  <Button size="sm">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}