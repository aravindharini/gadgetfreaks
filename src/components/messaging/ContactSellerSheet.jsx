import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function ContactSellerSheet({ listing, children }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      const user = await base44.auth.me();
      
      if (user.email === listing.created_by) {
        toast.error("You cannot message yourself");
        setIsSending(false);
        return;
      }

      await base44.entities.Message.create({
        listing_id: listing.id,
        recipient_email: listing.created_by,
        content: message.trim(),
        listing_title: listing.title
      });

      toast.success("Message sent!");
      setMessage("");
      setIsOpen(false);
      
      // Navigate to messages page
      setTimeout(() => {
        navigate(createPageUrl("Messages"));
      }, 500);
    } catch (error) {
      if (error.message?.includes("not authenticated")) {
        toast.error("Please sign in to contact the seller");
        base44.auth.redirectToLogin();
      } else {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
      }
    }
    setIsSending(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Seller
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Contact Seller</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-1">{listing.title}</p>
            <p className="text-lg font-bold text-blue-600">RM{listing.price?.toLocaleString()}</p>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Your Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, I'm interested in this item..."
                rows={6}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Be polite and respectful when contacting sellers
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isSending || !message.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}