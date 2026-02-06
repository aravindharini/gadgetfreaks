import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        const { count = 30 } = await req.json();

        // Use LLM to generate realistic smartphone listings based on Malaysian market
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Generate ${count} realistic smartphone listings for a Malaysian marketplace. Include popular brands like iPhone, Samsung, Xiaomi, OPPO, Vivo, Realme, etc. Mix of new and used conditions with realistic Malaysian prices (MYR).

Return a JSON array with this exact structure:
{
  "listings": [
    {
      "title": "iPhone 15 Pro Max 256GB",
      "description": "Detailed description of the phone condition, included accessories, warranty status",
      "price": 5299,
      "category": "smartphone",
      "brand": "Apple",
      "model": "iPhone 15 Pro Max",
      "condition": "mint|excellent|good|fair",
      "storage": "256GB",
      "color": "Natural Titanium",
      "carrier": "unlocked",
      "images": ["https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800"],
      "seller_notes": "Additional notes"
    }
  ]
}

Important:
- Use realistic Malaysian market prices (2024-2026)
- Mix conditions: 40% excellent, 30% mint, 20% good, 10% fair
- Include popular models from last 2-3 years
- Use real Unsplash image URLs for smartphones (search unsplash.com)
- Make descriptions realistic and detailed (battery health, scratches, box/accessories included)
- Carrier should be "unlocked" or specific Malaysian carriers (Maxis, Celcom, Digi)`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    listings: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" },
                                price: { type: "number" },
                                category: { type: "string" },
                                brand: { type: "string" },
                                model: { type: "string" },
                                condition: { type: "string" },
                                storage: { type: "string" },
                                color: { type: "string" },
                                carrier: { type: "string" },
                                images: { type: "array", items: { type: "string" } },
                                seller_notes: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        // Insert listings into database
        const listings = result.listings.map(listing => ({
            ...listing,
            status: "active",
            featured: Math.random() > 0.7 // 30% chance of being featured
        }));

        await base44.asServiceRole.entities.Listing.bulkCreate(listings);

        return Response.json({ 
            success: true, 
            count: listings.length,
            message: `Successfully generated and imported ${listings.length} smartphone listings`
        });

    } catch (error) {
        console.error('Error generating listings:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});