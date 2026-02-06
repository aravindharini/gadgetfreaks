import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        const { count = 30 } = await req.json();

        // Generate smartphone listings in batches to avoid JSON parsing issues
        const batchSize = 10;
        const batches = Math.ceil(count / batchSize);
        let allListings = [];

        for (let i = 0; i < batches; i++) {
            const batchCount = Math.min(batchSize, count - (i * batchSize));
            
            const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: `Generate ${batchCount} realistic smartphone listings for a Malaysian marketplace.

Include these brands: iPhone, Samsung, Xiaomi, OPPO, Vivo, Realme, OnePlus, Google Pixel
Use realistic Malaysian prices (RM 300 - RM 6000)
Mix conditions: mint, excellent, good, fair

Return ONLY valid JSON, no extra text:
{
  "listings": [
    {
      "title": "Brand Model Storage",
      "description": "Condition details, accessories, warranty",
      "price": 2999,
      "category": "smartphone",
      "brand": "Apple",
      "model": "iPhone 14",
      "condition": "excellent",
      "storage": "128GB",
      "color": "Blue",
      "carrier": "unlocked",
      "images": ["https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800"],
      "seller_notes": "Notes"
    }
  ]
}`,
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

            allListings = [...allListings, ...result.listings];
        }

        // Insert listings into database
        const listings = allListings.map(listing => ({
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