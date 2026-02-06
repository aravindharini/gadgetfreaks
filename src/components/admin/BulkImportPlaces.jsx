import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BulkImportPlaces() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState([]);
  
  const malaysianCities = [
    "Kuala Lumpur, Malaysia",
    "Petaling Jaya, Malaysia",
    "Shah Alam, Malaysia",
    "Subang Jaya, Malaysia",
    "Johor Bahru, Malaysia",
    "Penang, Malaysia",
    "Ipoh, Malaysia",
    "Malacca, Malaysia",
    "Kota Kinabalu, Malaysia",
    "Kuching, Malaysia"
  ];

  const serviceTypes = [
    { value: "restaurant", label: "Restaurants" },
    { value: "cafe", label: "Cafés" },
    { value: "shopping_mall", label: "Shopping Malls" },
    { value: "spa", label: "Spas & Beauty" },
    { value: "gym", label: "Gyms & Fitness" },
    { value: "hospital", label: "Hospitals" },
    { value: "doctor", label: "Clinics & Doctors" },
    { value: "lodging", label: "Hotels & Accommodations" },
    { value: "night_club", label: "Night Clubs" },
    { value: "bar", label: "Bars & Lounges" }
  ];

  const [selectedCities, setSelectedCities] = useState(malaysianCities.slice(0, 5));
  const [selectedTypes, setSelectedTypes] = useState(serviceTypes.map(t => t.value));

  const toggleCity = (city) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleBulkImport = async () => {
    if (selectedCities.length === 0 || selectedTypes.length === 0) {
      toast.error("Please select at least one city and one service type");
      return;
    }

    setImporting(true);
    setResults([]);

    for (const city of selectedCities) {
      try {
        const { data } = await base44.functions.invoke('importGooglePlaces', {
          location: city,
          types: selectedTypes
        });

        setResults(prev => [...prev, {
          city,
          success: true,
          imported: data.imported || 0,
          message: data.message
        }]);

        toast.success(`${city}: ${data.imported} places imported`);
      } catch (error) {
        console.error(`Error importing ${city}:`, error);
        setResults(prev => [...prev, {
          city,
          success: false,
          error: error.message
        }]);
        toast.error(`Failed to import from ${city}`);
      }
    }

    setImporting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Bulk Import Services from Google Places
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cities Selection */}
        <div>
          <h3 className="font-semibold mb-3">Select Cities</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {malaysianCities.map(city => (
              <div key={city} className="flex items-center space-x-2">
                <Checkbox
                  id={`city-${city}`}
                  checked={selectedCities.includes(city)}
                  onCheckedChange={() => toggleCity(city)}
                  disabled={importing}
                />
                <label
                  htmlFor={`city-${city}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {city.split(',')[0]}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Service Types Selection */}
        <div>
          <h3 className="font-semibold mb-3">Select Service Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {serviceTypes.map(type => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={selectedTypes.includes(type.value)}
                  onCheckedChange={() => toggleType(type.value)}
                  disabled={importing}
                />
                <label
                  htmlFor={`type-${type.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Import Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            {selectedCities.length} cities × {selectedTypes.length} types = ~{selectedCities.length * selectedTypes.length * 10} places
          </p>
          <Button
            onClick={handleBulkImport}
            disabled={importing || selectedCities.length === 0 || selectedTypes.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Start Import
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold mb-3">Import Results</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.success ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">{result.city}</span>
                </div>
                {result.success ? (
                  <Badge className="bg-green-600">
                    {result.imported} imported
                  </Badge>
                ) : (
                  <span className="text-sm text-red-600">{result.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}