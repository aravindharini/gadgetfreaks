import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Lightbulb, 
  DollarSign, 
  Target, 
  Loader2,
  ArrowUpRight,
  AlertCircle
} from "lucide-react";

export default function ProviderInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getProviderInsights', {});
      setInsights(response.data.insights);
    } catch (err) {
      console.error("Error loading insights:", err);
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <p className="text-gray-600">{error}</p>
          <Button onClick={loadInsights} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Market Insights</h2>
          <p className="text-gray-600">Data-driven recommendations to grow your business</p>
        </div>
        <Button variant="outline" onClick={loadInsights}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Insights
        </Button>
      </div>

      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="w-4 h-4 mr-2" />
            Add Services
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Target className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Demand Services</CardTitle>
              <CardDescription>Services with the strongest market demand</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.trending_services?.map((service, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {service.service_type.replace(/_/g, ' ')}
                        </h3>
                        <Badge className="bg-blue-600">
                          Demand: {Math.round(service.demand_score * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.reason}</p>
                      <p className="text-sm font-medium text-green-600">
                        Avg Market Price: RM {service.avg_market_price?.toFixed(2)}
                      </p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-blue-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Services to Add</CardTitle>
              <CardDescription>Expand your offerings with these high-opportunity services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.recommended_services?.map((service, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-100">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{service.service_name}</h3>
                      <Badge variant="outline" className="text-purple-700 border-purple-300">
                        {service.service_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{service.market_opportunity}</p>
                    <p className="text-sm font-medium text-green-600">
                      Suggested Price: {service.suggested_price_range}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Optimization</CardTitle>
              <CardDescription>Suggested price adjustments for your current services</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.pricing_suggestions?.length > 0 ? (
                <div className="space-y-4">
                  {insights.pricing_suggestions.map((suggestion, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-100">
                      <h3 className="font-semibold text-gray-900 mb-2">{suggestion.current_service}</h3>
                      <div className="flex items-center gap-4 mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Current</p>
                          <p className="text-lg font-bold text-gray-700">RM {suggestion.current_price}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Suggested</p>
                          <p className="text-lg font-bold text-green-600">RM {suggestion.suggested_price}</p>
                        </div>
                        <Badge className={suggestion.suggested_price > suggestion.current_price ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                          {suggestion.suggested_price > suggestion.current_price ? "Increase" : "Optimize"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No pricing suggestions available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Intelligence</CardTitle>
              <CardDescription>Key insights and opportunities in your market</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.market_insights?.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}