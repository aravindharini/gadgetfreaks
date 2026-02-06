import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { location = "Kuala Lumpur, Malaysia", types = ["hospital", "doctor", "night_club", "bar", "lodging", "restaurant", "cafe", "shopping_mall", "spa", "gym"] } = await req.json();

        const apiKey = Deno.env.get("GOOGLE_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'Google API key not configured' }, { status: 500 });
        }

        // First, geocode the location to get coordinates
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
        const geocodeRes = await fetch(geocodeUrl);
        const geocodeData = await geocodeRes.json();

        console.log('Geocode response:', geocodeData);

        if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
            return Response.json({ 
                error: 'Failed to geocode location', 
                details: geocodeData.error_message || geocodeData.status 
            }, { status: 400 });
        }

        const { lat, lng } = geocodeData.results[0].geometry.location;
        const allListings = [];

        // Search for each type of place
        for (const type of types) {
            const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&type=${type}&key=${apiKey}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.status !== 'OK') {
                console.log(`No results for type: ${type}`);
                continue;
            }

            // Get detailed info for each place
            for (const place of searchData.results.slice(0, 10)) {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,geometry,rating,photos,types&key=${apiKey}`;
                const detailsRes = await fetch(detailsUrl);
                const detailsData = await detailsRes.json();

                if (detailsData.status !== 'OK') continue;

                const details = detailsData.result;

                // Map Google type to our service_type
                let serviceType = 'other';
                if (details.types.includes('hospital')) serviceType = 'hospital';
                else if (details.types.includes('doctor') || details.types.includes('health') || details.types.includes('dentist')) serviceType = 'clinic';
                else if (details.types.includes('lodging') || details.types.includes('hotel')) serviceType = 'hotel';
                else if (details.types.includes('restaurant')) serviceType = 'restaurant';
                else if (details.types.includes('cafe')) serviceType = 'cafe';
                else if (details.types.includes('shopping_mall') || details.types.includes('shopping_center')) serviceType = 'shopping_mall';
                else if (details.types.includes('spa') || details.types.includes('beauty_salon')) serviceType = 'other';
                else if (details.types.includes('gym') || details.types.includes('fitness')) serviceType = 'other';
                else if (details.types.includes('night_club') || details.types.includes('bar')) serviceType = 'other';

                // Get photo URL if available
                const photoUrl = details.photos?.[0]?.photo_reference
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${details.photos[0].photo_reference}&key=${apiKey}`
                    : null;

                const listing = {
                    title: details.name,
                    description: `${details.types.slice(0, 3).join(', ')}${details.rating ? ` • Rating: ${details.rating}/5` : ''}`,
                    price: 0,
                    category: 'services',
                    service_type: serviceType,
                    condition: 'excellent',
                    address: details.formatted_address,
                    contact_phone: details.formatted_phone_number || '',
                    website: details.website || '',
                    operating_hours: details.opening_hours?.weekday_text?.join(' • ') || 'Hours not available',
                    latitude: details.geometry.location.lat,
                    longitude: details.geometry.location.lng,
                    images: photoUrl ? [photoUrl] : [],
                    status: 'active',
                    featured: false,
                    services_offered: details.types.slice(0, 5)
                };

                allListings.push(listing);
            }
        }

        // Bulk create listings
        if (allListings.length > 0) {
            await base44.asServiceRole.entities.Listing.bulkCreate(allListings);
        }

        return Response.json({
            success: true,
            imported: allListings.length,
            message: `Successfully imported ${allListings.length} establishments from Google Places`
        });

    } catch (error) {
        console.error('Error importing Google Places:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});