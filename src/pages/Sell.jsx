import React, { useState } from "react";
import { Listing } from "@/entities/Listing";
import { UploadFile } from "@/integrations/Core";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, DollarSign, Camera, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Sell() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    model: "",
    condition: "",
    storage: "",
    color: "",
    carrier: "",
    seller_notes: "",
    images: []
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (formData.images.length >= 8) {
        setError("Maximum 8 images allowed");
        break;
      }

      setUploadingImage(true);
      try {
        const result = await UploadFile({ file });
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result.file_url]
        }));
      } catch (error) {
        setError("Failed to upload image. Please try again.");
      }
    }
    setUploadingImage(false);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate required fields
      const requiredFields = ['title', 'price', 'category', 'condition'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      if (formData.images.length === 0) {
        setError("Please add at least one image");
        setIsSubmitting(false);
        return;
      }

      // Create the listing
      const listingData = {
        ...formData,
        price: parseFloat(formData.price),
        status: "active"
      };

      await Listing.create(listingData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate(createPageUrl("Profile"));
      }, 2000);

    } catch (error) {
      setError("Failed to create listing. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Listing Created!</h2>
            <p className="text-gray-600">Your item is now live on the marketplace</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Device</h1>
          <p className="text-gray-600">Create a listing to sell your electronics</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photos (Required)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {formData.images.length < 8 && (
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    ) : (
                      <>
                        <Plus className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Add Photo</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Add up to 8 photos. First photo will be the main image.
              </p>
            </CardContent>
          </Card>

          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., iPhone 14 Pro 256GB Space Black"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the condition, any issues, what's included..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1 h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (MYR) *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="299"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smartphone">Smartphone</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="smartwatch">Smartwatch</SelectItem>
                      <SelectItem value="headphones">Headphones</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="camera">Camera</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="Apple, Samsung, Google..."
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="iPhone 14 Pro, Galaxy S23..."
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mint">Mint - Like new, no visible wear</SelectItem>
                    <SelectItem value="excellent">Excellent - Minor wear, fully functional</SelectItem>
                    <SelectItem value="good">Good - Normal wear, works perfectly</SelectItem>
                    <SelectItem value="fair">Fair - Heavy wear but functional</SelectItem>
                    <SelectItem value="poor">Poor - Significant issues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="storage">Storage</Label>
                  <Input
                    id="storage"
                    placeholder="256GB, 1TB..."
                    value={formData.storage}
                    onChange={(e) => handleInputChange('storage', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="Space Black, Silver..."
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="carrier">Carrier</Label>
                  <Input
                    id="carrier"
                    placeholder="Unlocked, Verizon..."
                    value={formData.carrier}
                    onChange={(e) => handleInputChange('carrier', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="seller_notes">Additional Notes</Label>
                <Textarea
                  id="seller_notes"
                  placeholder="Any other details buyers should know..."
                  value={formData.seller_notes}
                  onChange={(e) => handleInputChange('seller_notes', e.target.value)}
                  className="mt-1 h-20"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(createPageUrl("Home"))}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Creating Listing..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}