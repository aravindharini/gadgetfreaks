import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cartItems, successUrl, cancelUrl } = await req.json();

    if (!cartItems || cartItems.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Create line items for Stripe
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: 'myr',
        product_data: {
          name: item.title,
          images: item.images?.slice(0, 1) || [],
          description: `${item.brand || ''} ${item.model || ''}`.trim() || item.description?.substring(0, 100)
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity || 1,
    }));

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
        cart_items: JSON.stringify(cartItems.map(item => ({
          listing_id: item.listing_id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          seller_email: item.seller_email
        })))
      }
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});