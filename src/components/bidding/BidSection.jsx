import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gavel, Clock, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";

export default function BidSection({ listing, onBidPlaced }) {
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    loadBids();
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [listing]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const loadBids = async () => {
    try {
      const allBids = await base44.entities.Bid.filter({ 
        listing_id: listing.id,
        status: "active"
      }, "-created_date");
      setBids(allBids);
    } catch (error) {
      console.error("Error loading bids:", error);
    }
  };

  const updateTimeRemaining = () => {
    if (!listing.auction_end_date) return;
    
    const end = new Date(listing.auction_end_date);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) {
      setTimeRemaining("Ended");
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m`);
    } else {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }
  };

  const placeBid = async () => {
    if (!user) {
      toast.error("Please login to place a bid");
      return;
    }

    const amount = parseFloat(bidAmount);
    const minBid = (listing.current_bid || listing.starting_bid) + 1;

    if (!amount || amount < minBid) {
      toast.error(`Minimum bid is RM${minBid}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Mark previous bids as outbid
      if (bids.length > 0) {
        await Promise.all(
          bids.map(bid => 
            base44.entities.Bid.update(bid.id, { status: "outbid" })
          )
        );
      }

      // Create new bid
      await base44.entities.Bid.create({
        listing_id: listing.id,
        amount: amount,
        status: "active",
        listing_title: listing.title
      });

      // Update listing with new current bid
      await base44.entities.Listing.update(listing.id, {
        current_bid: amount,
        bid_count: (listing.bid_count || 0) + 1
      });

      toast.success("Bid placed successfully!");
      setBidAmount("");
      loadBids();
      if (onBidPlaced) onBidPlaced();
    } catch (error) {
      toast.error("Failed to place bid");
    }
    setIsSubmitting(false);
  };

  const isAuctionEnded = timeRemaining === "Ended";
  const currentBid = listing.current_bid || listing.starting_bid;

  return (
    <div className="space-y-4">
      {/* Auction Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Live Auction</span>
            </div>
            <Badge className={`${isAuctionEnded ? "bg-red-500" : "bg-green-500"} text-white border-0`}>
              <Clock className="w-3 h-3 mr-1" />
              {timeRemaining}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Bid</p>
              <p className="text-2xl font-bold text-gray-900">
                RM{currentBid?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bids</p>
              <p className="text-2xl font-bold text-gray-900">
                {listing.bid_count || 0}
              </p>
            </div>
          </div>

          {!isAuctionEnded && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Minimum bid: RM{(currentBid + 1).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter your bid"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    disabled={isSubmitting}
                    min={currentBid + 1}
                  />
                  <Button 
                    onClick={placeBid}
                    disabled={isSubmitting || !bidAmount}
                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  >
                    {isSubmitting ? "Placing..." : "Place Bid"}
                  </Button>
                </div>
              </div>

              {listing.price && (
                <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Buy Now for RM{listing.price?.toLocaleString()}
                </Button>
              )}
            </div>
          )}

          {isAuctionEnded && (
            <p className="text-center text-gray-600 py-2">
              This auction has ended
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bid History */}
      {bids.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bid History</h3>
            <div className="space-y-3">
              {bids.slice(0, 5).map((bid, idx) => (
                <div key={bid.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${bid.created_by}`} />
                      <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {idx === 0 && <Badge className="mr-2 bg-green-500 text-white border-0 text-xs">Highest</Badge>}
                        Bidder
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(bid.created_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    RM{bid.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}