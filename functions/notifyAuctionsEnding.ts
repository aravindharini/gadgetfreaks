import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all active auctions
        const auctions = await base44.asServiceRole.entities.Listing.filter({
            is_auction: true,
            status: 'active'
        });

        const now = new Date();
        const notifications = [];

        for (const auction of auctions) {
            if (!auction.auction_end_date) continue;

            const endDate = new Date(auction.auction_end_date);
            const hoursUntilEnd = (endDate - now) / (1000 * 60 * 60);

            // Notify if auction ends in 1-2 hours (run this every hour)
            if (hoursUntilEnd > 1 && hoursUntilEnd <= 2) {
                // Get all bidders for this auction
                const bids = await base44.asServiceRole.entities.Bid.filter({
                    listing_id: auction.id
                });

                // Get unique bidders
                const bidders = [...new Set(bids.map(b => b.created_by))];

                // Create notifications for each bidder
                const bidderNotifications = bidders.map(bidder => ({
                    user_email: bidder,
                    type: 'order',
                    title: 'Auction Ending Soon!',
                    message: `"${auction.title}" auction ends in less than 2 hours. Current bid: RM${(auction.current_bid || auction.starting_bid).toLocaleString()}`,
                    link: `/Listing?id=${auction.id}`,
                    data: {
                        listing_id: auction.id,
                        current_bid: auction.current_bid || auction.starting_bid,
                        ends_at: auction.auction_end_date
                    }
                }));

                notifications.push(...bidderNotifications);

                // Also notify the seller
                notifications.push({
                    user_email: auction.created_by,
                    type: 'order',
                    title: 'Your Auction Ending Soon',
                    message: `Your auction "${auction.title}" ends in less than 2 hours. Current bid: RM${(auction.current_bid || auction.starting_bid).toLocaleString()}`,
                    link: `/Listing?id=${auction.id}`,
                    data: {
                        listing_id: auction.id,
                        current_bid: auction.current_bid || auction.starting_bid,
                        ends_at: auction.auction_end_date
                    }
                });
            }
        }

        if (notifications.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
        }

        return Response.json({ 
            success: true,
            message: `Checked ${auctions.length} auctions, sent ${notifications.length} notifications`
        });

    } catch (error) {
        console.error('Error in notifyAuctionsEnding:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});