import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Handle automation trigger
    let booking_id;
    if (payload.event) {
      // Called from automation
      booking_id = payload.event.entity_id;
      const newData = payload.data;
      const oldData = payload.old_data;

      // Only send email if status changed to confirmed
      if (newData?.status !== 'confirmed' || oldData?.status === 'confirmed') {
        return Response.json({ message: 'Status not changed to confirmed, email not sent' });
      }
    } else {
      // Called directly
      booking_id = payload.booking_id;
    }

    if (!booking_id) {
      return Response.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Fetch booking details
    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only send email if status is confirmed
    if (booking.status !== 'confirmed') {
      return Response.json({ message: 'Booking not confirmed, email not sent' });
    }

    // Fetch listing details for location/address
    const listing = await base44.asServiceRole.entities.Listing.get(booking.listing_id);

    // Compose email
    const emailSubject = `Booking Confirmed: ${booking.listing_title}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your Booking is Confirmed! ✓</h2>
        
        <p>Dear ${booking.customer_name},</p>
        
        <p>Great news! Your booking has been confirmed by the service provider.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Booking Details</h3>
          
          <p><strong>Service:</strong> ${booking.listing_title}</p>
          <p><strong>Service Details:</strong> ${booking.service_details || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString('en-MY', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Time:</strong> ${booking.booking_time}</p>
          <p><strong>Duration:</strong> ${booking.duration} minutes</p>
          <p><strong>Total Price:</strong> RM ${booking.total_price}</p>
          <p><strong>Payment Status:</strong> ${booking.payment_status || 'unpaid'}</p>
        </div>
        
        ${listing?.address ? `
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Location</h3>
          <p>${listing.address}</p>
          ${listing.contact_phone ? `<p><strong>Contact:</strong> ${listing.contact_phone}</p>` : ''}
        </div>
        ` : ''}
        
        ${booking.additional_notes ? `
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Your Notes</h3>
          <p>${booking.additional_notes}</p>
        </div>
        ` : ''}
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Service Provider Contact</h3>
          <p><strong>Email:</strong> ${booking.service_provider_email}</p>
          ${listing?.contact_phone ? `<p><strong>Phone:</strong> ${listing.contact_phone}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px;">If you have any questions, please contact the service provider directly.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Thank you for using GadgetFreaks!
        </p>
      </div>
    `;

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.customer_email,
      subject: emailSubject,
      body: emailBody
    });

    console.log(`Confirmation email sent to ${booking.customer_email} for booking ${booking_id}`);

    return Response.json({ 
      success: true, 
      message: 'Confirmation email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});