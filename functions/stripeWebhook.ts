import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return Response.json({ error: 'Webhook configuration error' }, { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Create base44 client after getting body but before verification
    const base44 = createClientFromRequest(req);
    
    // Verify webhook signature (async method for Deno)
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event:', event.type);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata;

      if (metadata.cart_items && metadata.user_email) {
        const cartItems = JSON.parse(metadata.cart_items);
        
        // Create order
        const order = await base44.asServiceRole.entities.Order.create({
          order_number: `ORD-${Date.now()}`,
          total_amount: session.amount_total / 100,
          status: 'confirmed',
          items: cartItems,
          payment_method: 'credit_card'
        });

        // Mark listings as sold
        for (const item of cartItems) {
          await base44.asServiceRole.entities.Listing.update(item.listing_id, {
            status: 'sold'
          });
        }

        // Clear user's cart
        const userCart = await base44.asServiceRole.entities.Cart.filter({
          created_by: metadata.user_email
        });
        for (const cartItem of userCart) {
          await base44.asServiceRole.entities.Cart.delete(cartItem.id);
        }

        // Create notifications for sellers
        for (const item of cartItems) {
          if (item.seller_email) {
            await base44.asServiceRole.entities.Notification.create({
              user_email: item.seller_email,
              type: 'order',
              title: 'New sale!',
              message: `Your item "${item.title}" has been sold for RM${item.price.toLocaleString()}`,
              link: `/SellerDashboard`,
              data: { order_id: order.id }
            });
          }
        }

        // Create notification for buyer
        await base44.asServiceRole.entities.Notification.create({
          user_email: metadata.user_email,
          type: 'order',
          title: 'Order confirmed!',
          message: `Your order #${order.order_number} has been confirmed`,
          link: `/OrderConfirmation?orderId=${order.id}`
        });

        console.log('Order created:', order.id);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});