import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data } = await req.json();

        // Only process bid creation
        if (event.type !== 'create' || !data) {
            return Response.json({ success: true, message: 'No action needed' });
        }

        // Get the listing details
        const listing = await base44.asServiceRole.entities.Listing.get(data.listing_id);
        
        if (!listing) {
            return Response.json({ error: 'Listing not found' }, { status: 404 });
        }

        // Notify the seller about the new bid
        await base44.asServiceRole.entities.Notification.create({
            user_email: listing.created_by,
            type: 'order',
            title: 'New Bid on Your Auction!',
            message: `Someone bid RM${data.amount.toLocaleString()} on "${listing.title}"`,
            link: `/Listing?id=${listing.id}`,
            data: {
                listing_id: listing.id,
                bid_amount: data.amount,
                bidder: data.created_by
            }
        });

        // Notify other bidders that they've been outbid
        const previousBids = await base44.asServiceRole.entities.Bid.filter({
            listing_id: data.listing_id,
            status: 'active'
        });

        const outbidNotifications = previousBids
            .filter(bid => bid.id !== data.id && bid.created_by !== data.created_by)
            .map(bid => ({
                user_email: bid.created_by,
                type: 'order',
                title: 'You\'ve Been Outbid!',
                message: `Your bid of RM${bid.amount.toLocaleString()} on "${listing.title}" has been outbid`,
                link: `/Listing?id=${listing.id}`,
                data: {
                    listing_id: listing.id,
                    old_bid: bid.amount,
                    new_bid: data.amount
                }
            }));

        if (outbidNotifications.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(outbidNotifications);
        }

        return Response.json({ 
            success: true,
            message: `Notified seller and ${outbidNotifications.length} outbid users`
        });

    } catch (error) {
        console.error('Error in notifyNewBid:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});