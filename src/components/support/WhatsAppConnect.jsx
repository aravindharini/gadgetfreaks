import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ShoppingBag, Package, CheckCircle } from "lucide-react";

export default function WhatsAppConnect() {
  const features = [
    {
      icon: MessageCircle,
      title: "24/7 Support",
      description: "Get instant help anytime"
    },
    {
      icon: ShoppingBag,
      title: "Browse Products",
      description: "Find gadgets via chat"
    },
    {
      icon: Package,
      title: "Track Orders",
      description: "Check order status easily"
    },
    {
      icon: CheckCircle,
      title: "Quick Checkout",
      description: "Place orders directly"
    }
  ];

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <MessageCircle className="w-5 h-5" />
          Shop via WhatsApp
        </CardTitle>
        <CardDescription>
          Get personalized assistance and place orders through WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-green-100">
              <feature.icon className="w-5 h-5 text-green-600 mb-2" />
              <p className="text-xs font-medium text-gray-900">{feature.title}</p>
              <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
            </div>
          ))}
        </div>

        <a 
          href={base44.agents.getWhatsAppConnectURL('support_assistant')}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="w-4 h-4 mr-2" />
            Connect WhatsApp
          </Button>
        </a>

        <p className="text-xs text-center text-gray-500">
          Secure and private. Your number stays safe.
        </p>
      </CardContent>
    </Card>
  );
}