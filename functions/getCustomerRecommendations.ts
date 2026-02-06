import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather user data
    const [bookings, wishlist, listings] = await Promise.all([
      base44.entities.Booking.filter({ created_by: user.email }),
      base44.entities.Wishlist.filter({ created_by: user.email }),
      base44.entities.Listing.filter({ status: 'active' })
    ]);

    // Get viewed listings (top 20 most viewed by this user)
    const viewedListings = listings
      .filter(l => l.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    // Prepare context for AI
    const userContext = {
      past_bookings: bookings.map(b => ({
        service: b.listing_title,
        service_details: b.service_details,
        date: b.booking_date
      })).slice(0, 10),
      wishlist_items: wishlist.map(w => w.listing_title).slice(0, 10),
      viewed_services: viewedListings.map(l => ({
        title: l.title,
        category: l.category,
        service_type: l.service_type,
        price: l.price
      }))
    };

    const availableServices = listings.map(l => ({
      id: l.id,
      title: l.title,
      category: l.category,
      service_type: l.service_type,
      price: l.price,
      address: l.address,
      services_offered: l.services_offered
    }));

    // Use AI to generate recommendations
    const prompt = `You are a recommendation engine for a service booking platform. 
    
Based on the user's history:
${JSON.stringify(userContext, null, 2)}

Available services:
${JSON.stringify(availableServices, null, 2)}

Analyze the user's preferences and recommend 5-8 services they would be most interested in.
Consider:
- Past booking patterns
- Wishlist preferences
- Viewing history
- Service categories they engage with
- Price ranges they typically book

Return recommendations with reasoning.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                listing_id: { type: "string" },
                reason: { type: "string" },
                confidence: { type: "number" }
              }
            }
          }
        }
      }
    });

    // Enrich recommendations with full listing data
    const enrichedRecommendations = aiResponse.recommendations
      .map(rec => {
        const listing = listings.find(l => l.id === rec.listing_id);
        return listing ? { ...listing, reason: rec.reason, confidence: rec.confidence } : null;
      })
      .filter(r => r !== null);

    return Response.json({
      success: true,
      recommendations: enrichedRecommendations
    });

  } catch (error) {
    console.error('Error generating customer recommendations:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});