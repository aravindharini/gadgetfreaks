import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  Watch,
  Headphones,
  Gamepad2,
  Camera,
  Cpu
} from "lucide-react";

const categories = [
  {
    id: "smartphone",
    name: "Smartphones",
    icon: Smartphone,
    color: "from-blue-500 to-blue-600",
    count: "2.1k+ listings"
  },
  {
    id: "tablet", 
    name: "Tablets",
    icon: Tablet,
    color: "from-purple-500 to-purple-600",
    count: "850+ listings"
  },
  {
    id: "laptop",
    name: "Laptops", 
    icon: Laptop,
    color: "from-emerald-500 to-emerald-600",
    count: "1.2k+ listings"
  },
  {
    id: "smartwatch",
    name: "Smartwatches",
    icon: Watch,
    color: "from-orange-500 to-orange-600",
    count: "640+ listings"
  },
  {
    id: "headphones",
    name: "Headphones",
    icon: Headphones,
    color: "from-pink-500 to-pink-600", 
    count: "920+ listings"
  },
  {
    id: "gaming",
    name: "Gaming",
    icon: Gamepad2,
    color: "from-red-500 to-red-600",
    count: "480+ listings"
  },
  {
    id: "camera",
    name: "Cameras",
    icon: Camera,
    color: "from-yellow-500 to-yellow-600",
    count: "320+ listings"
  },
  {
    id: "accessories", 
    name: "Accessories",
    icon: Cpu,
    color: "from-gray-500 to-gray-600",
    count: "1.5k+ listings"
  }
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={createPageUrl(`Browse?category=${category.id}`)}
          className="group"
        >
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:scale-105 transition-all duration-300">
            <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <category.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
            <p className="text-sm text-gray-500">{category.count}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}