import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Paperclip, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function ServiceProviderChat({ booking, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // Subscribe to real-time updates
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === "create" && 
          (event.data.booking_id === booking.id || event.data.listing_id === booking.listing_id)) {
        loadMessages();
      }
    });

    return unsubscribe;
  }, [booking.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load messages for this booking or listing
      const allMessages = await base44.entities.Message.list();
      const relevantMessages = allMessages.filter(m => 
        (m.booking_id === booking.id || m.listing_id === booking.listing_id) &&
        (m.created_by === currentUser.email || m.recipient_email === currentUser.email ||
         m.created_by === booking.service_provider_email || m.recipient_email === booking.service_provider_email ||
         m.created_by === booking.customer_email || m.recipient_email === booking.customer_email)
      );

      relevantMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      setMessages(relevantMessages);

      // Mark unread messages as read
      for (const msg of relevantMessages) {
        if (msg.recipient_email === currentUser.email && !msg.read) {
          await base44.entities.Message.update(msg.id, { read: true });
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { data } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(data.file_url);
      }
      setAttachments([...attachments, ...uploadedUrls]);
      toast.success("Files uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      const recipientEmail = user.email === booking.service_provider_email 
        ? booking.customer_email 
        : booking.service_provider_email;

      await base44.entities.Message.create({
        listing_id: booking.listing_id,
        booking_id: booking.id,
        recipient_email: recipientEmail,
        content: newMessage.trim() || "(Attachment)",
        listing_title: booking.listing_title,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      // Send notification
      await base44.entities.Notification.create({
        user_email: recipientEmail,
        type: "message",
        title: "New message",
        message: `${user.full_name}: ${newMessage.trim() || "Sent an attachment"}`,
        link: `/bookings`
      });

      setNewMessage("");
      setAttachments([]);
      loadMessages();
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.listing_title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {user?.email === booking.service_provider_email 
                ? `Chat with ${booking.customer_name}` 
                : `Chat with service provider`}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.created_by === user?.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : ""}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {msg.created_by.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className={`rounded-lg p-3 ${
                      isMe 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block text-xs underline ${
                                isMe ? "text-blue-100" : "text-blue-600"
                              }`}
                            >
                              📎 Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(msg.created_date), "MMM dd, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {attachments.map((url, idx) => (
              <Badge key={idx} variant="outline" className="gap-1">
                📎 File {idx + 1}
                <button onClick={() => removeAttachment(idx)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={(!newMessage.trim() && attachments.length === 0) || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}