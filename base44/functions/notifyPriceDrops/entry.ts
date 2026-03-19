import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data, old_data } = await req.json();

        // Only process listing updates
        if (event.type !== 'update' || !data || !old_data) {
            return Response.json({ success: true, message: 'No action needed' });
        }

        // Check if price decreased
        const oldPrice = old_data.price;
        const newPrice = data.price;

        if (!oldPrice || !newPrice || newPrice >= oldPrice) {
            return Response.json({ success: true, message: 'No price drop' });
        }

        // Find all users who have this item in their wishlist
        const wishlistItems = await base44.asServiceRole.entities.Wishlist.filter({
            listing_id: event.entity_id
        });

        // Create notifications for each user
        const notifications = wishlistItems.map(item => ({
            user_email: item.created_by,
            type: 'price_drop',
            title: 'Price Drop Alert!',
            message: `"${data.title}" dropped from RM${oldPrice.toLocaleString()} to RM${newPrice.toLocaleString()}`,
            link: `/Listing?id=${event.entity_id}`,
            data: {
                listing_id: event.entity_id,
                old_price: oldPrice,
                new_price: newPrice,
                discount_percentage: Math.round(((oldPrice - newPrice) / oldPrice) * 100)
            }
        }));

        if (notifications.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
        }

        return Response.json({ 
            success: true, 
            notified: notifications.length,
            message: `Notified ${notifications.length} users about price drop`
        });

    } catch (error) {
        console.error('Error in notifyPriceDrops:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});