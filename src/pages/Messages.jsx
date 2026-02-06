import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, ArrowLeft, Send, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 100),
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (selectedThread) {
        queryClient.invalidateQueries({ queryKey: ['thread', selectedThread.key] });
      }
    });

    return unsubscribe;
  }, [user, selectedThread, queryClient]);

  const getThreads = () => {
    if (!user) return [];
    
    const threadMap = {};
    
    messages.forEach(msg => {
      const isRecipient = msg.recipient_email === user.email;
      const otherUser = isRecipient ? msg.created_by : msg.recipient_email;
      const threadKey = `${msg.listing_id}-${otherUser}`;
      
      if (!threadMap[threadKey] || new Date(msg.created_date) > new Date(threadMap[threadKey].lastMessage.created_date)) {
        const unreadCount = messages.filter(m => 
          m.listing_id === msg.listing_id &&
          ((m.created_by === otherUser && m.recipient_email === user.email) ||
           (m.recipient_email === otherUser && m.created_by === user.email)) &&
          m.recipient_email === user.email &&
          !m.read
        ).length;
        
        threadMap[threadKey] = {
          key: threadKey,
          listingId: msg.listing_id,
          listingTitle: msg.listing_title,
          otherUser,
          lastMessage: msg,
          unreadCount
        };
      }
    });
    
    return Object.values(threadMap).sort((a, b) => 
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  };

  const getThreadMessages = (thread) => {
    if (!thread || !user) return [];
    
    return messages
      .filter(msg => 
        msg.listing_id === thread.listingId &&
        ((msg.created_by === thread.otherUser && msg.recipient_email === user.email) ||
         (msg.recipient_email === thread.otherUser && msg.created_by === user.email))
      )
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || !user) return;
    
    setIsSending(true);
    try {
      await base44.entities.Message.create({
        listing_id: selectedThread.listingId,
        recipient_email: selectedThread.otherUser,
        content: newMessage.trim(),
        listing_title: selectedThread.listingTitle
      });
      
      // Create notification for recipient
      await base44.entities.Notification.create({
        user_email: selectedThread.otherUser,
        type: "message",
        title: "New message",
        message: `You have a new message about "${selectedThread.listingTitle}"`,
        link: createPageUrl("Messages")
      });
      
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
    setIsSending(false);
  };

  const markAsRead = async (thread) => {
    const unreadMessages = messages.filter(msg =>
      msg.listing_id === thread.listingId &&
      msg.created_by === thread.otherUser &&
      msg.recipient_email === user.email &&
      !msg.read
    );
    
    for (const msg of unreadMessages) {
      await base44.entities.Message.update(msg.id, { read: true });
    }
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  };

  const handleThreadSelect = (thread) => {
    setSelectedThread(thread);
    markAsRead(thread);
    setShowQuickReplies(false);
  };

  const quickReplies = [
    "Is this item still available?",
    "Can we negotiate the price?",
    "What's your best offer?",
    "Can I see more photos?",
    "Where can we meet?",
    "Is the condition as described?",
  ];

  const handleQuickReply = (text) => {
    setNewMessage(text);
    setShowQuickReplies(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your messages</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const threads = getThreads();
  const threadMessages = selectedThread ? getThreadMessages(selectedThread) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Threads List */}
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Conversations</h2>
              </div>
              <ScrollArea className="h-[calc(100vh-280px)]">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : threads.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  threads.map((thread) => (
                    <button
                      key={thread.key}
                      onClick={() => handleThreadSelect(thread)}
                      className={`w-full p-4 border-b hover:bg-gray-50 transition-colors text-left relative ${
                        selectedThread?.key === thread.key ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className={thread.unreadCount > 0 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}>
                            {thread.otherUser.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>
                              {thread.otherUser}
                            </p>
                            <div className="flex flex-col items-end gap-1">
                              <p className="text-xs text-gray-400">
                                {new Date(thread.lastMessage.created_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                              {thread.unreadCount > 0 && (
                                <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0">{thread.unreadCount}</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-1">{thread.listingTitle}</p>
                          <p className={`text-xs truncate ${thread.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            {thread.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages View */}
          <Card className="lg:col-span-2">
            {selectedThread ? (
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedThread(null)}
                      className="lg:hidden"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar>
                      <AvatarFallback>
                        {selectedThread.otherUser.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{selectedThread.otherUser}</p>
                      <Link 
                        to={createPageUrl(`Listing?id=${selectedThread.listingId}`)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedThread.listingTitle}
                      </Link>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {threadMessages.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Start the conversation</p>
                      </div>
                    ) : (
                      threadMessages.map((msg) => {
                        const isMe = msg.created_by === user.email;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                              <div className={`rounded-2xl px-4 py-3 ${
                                isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                              }`}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                              </div>
                              <div className={`flex items-center gap-2 mt-1 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <p className="text-xs text-gray-400">
                                  {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {isMe && msg.read && (
                                  <span className="text-xs text-gray-400">Read</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t">
                  {showQuickReplies && (
                    <div className="p-4 border-b bg-gray-50">
                      <p className="text-xs font-medium text-gray-700 mb-2">Quick Replies</p>
                      <div className="flex flex-wrap gap-2">
                        {quickReplies.map((reply, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickReply(reply)}
                            className="text-xs"
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="p-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                        className="flex-shrink-0"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={isSending || !newMessage.trim()} className="flex-shrink-0">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            ) : (
              <CardContent className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}