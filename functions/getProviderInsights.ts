import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather market data
    const [allListings, allBookings, userListings] = await Promise.all([
      base44.asServiceRole.entities.Listing.filter({ status: 'active', category: 'services' }),
      base44.asServiceRole.entities.Booking.filter({}),
      base44.entities.Listing.filter({ created_by: user.email, category: 'services' })
    ]);

    // Calculate market trends
    const serviceTypeStats = {};
    allListings.forEach(listing => {
      const type = listing.service_type || 'other';
      if (!serviceTypeStats[type]) {
        serviceTypeStats[type] = {
          count: 0,
          total_bookings: 0,
          avg_price: 0,
          prices: []
        };
      }
      serviceTypeStats[type].count++;
      serviceTypeStats[type].prices.push(listing.price);
    });

    // Calculate bookings per service type
    allBookings.forEach(booking => {
      const listing = allListings.find(l => l.id === booking.listing_id);
      if (listing && listing.service_type) {
        const type = listing.service_type;
        if (serviceTypeStats[type]) {
          serviceTypeStats[type].total_bookings++;
        }
      }
    });

    // Calculate average prices
    Object.keys(serviceTypeStats).forEach(type => {
      const prices = serviceTypeStats[type].prices;
      serviceTypeStats[type].avg_price = prices.length > 0 
        ? prices.reduce((a, b) => a + b, 0) / prices.length 
        : 0;
      delete serviceTypeStats[type].prices;
    });

    // Get user's current services
    const userServices = userListings.map(l => ({
      title: l.title,
      service_type: l.service_type,
      price: l.price,
      services_offered: l.services_offered
    }));

    // Use AI to generate insights
    const prompt = `You are a business intelligence assistant for service providers on a booking platform.

Market Data:
${JSON.stringify(serviceTypeStats, null, 2)}

Provider's Current Services:
${JSON.stringify(userServices, null, 2)}

Total Market Size: ${allListings.length} active services
Total Bookings (last period): ${allBookings.length}

Analyze the market and provide:
1. Top 3-5 trending service types with high demand
2. Recommended services this provider should add based on market gaps
3. Pricing optimization suggestions for their current services
4. Market opportunities and insights

Be specific, data-driven, and actionable.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          trending_services: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service_type: { type: "string" },
                demand_score: { type: "number" },
                avg_market_price: { type: "number" },
                reason: { type: "string" }
              }
            }
          },
          recommended_services: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service_name: { type: "string" },
                service_type: { type: "string" },
                suggested_price_range: { type: "string" },
                market_opportunity: { type: "string" }
              }
            }
          },
          pricing_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                current_service: { type: "string" },
                current_price: { type: "number" },
                suggested_price: { type: "number" },
                reasoning: { type: "string" }
              }
            }
          },
          market_insights: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      insights: aiResponse,
      market_stats: serviceTypeStats
    });

  } catch (error) {
    console.error('Error generating provider insights:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});