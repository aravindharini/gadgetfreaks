import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingData } = await req.json();

    // Create the booking first
    const booking = await base44.entities.Booking.create({
      ...bookingData,
      payment_status: "unpaid",
      status: "pending"
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: {
              name: `Booking: ${bookingData.listing_title}`,
              description: `${bookingData.booking_date} at ${bookingData.booking_time} (${bookingData.duration} min)`,
            },
            unit_amount: Math.round(bookingData.total_price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/bookings?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${req.headers.get('origin')}/bookings?canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        booking_id: booking.id,
        customer_email: bookingData.customer_email,
        listing_id: bookingData.listing_id
      },
      customer_email: bookingData.customer_email || user.email,
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url,
      bookingId: booking.id
    });

  } catch (error) {
    console.error("Booking checkout error:", error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});