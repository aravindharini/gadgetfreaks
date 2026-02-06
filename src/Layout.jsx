import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cart } from "@/entities/Cart";
import { User } from "@/entities/User";
import { 
  Home, 
  Search, 
  Plus, 
  User as UserIcon,
  Smartphone,
  Menu,
  X,
  ShoppingCart,
  MessageCircle,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import ChatBot from "@/components/chat/ChatBot";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);

  // Load cart count
  React.useEffect(() => {
    loadCartCount();
  }, [location.pathname]);

  const loadCartCount = async () => {
    try {
      const user = await User.me();
      const cartItems = await Cart.filter({ created_by: user.email });
      setCartCount(cartItems.length);
    } catch (error) {
      setCartCount(0);
    }
  };

  const navigation = [
    { name: "Home", href: createPageUrl("Home"), icon: Home },
    { name: "Browse", href: createPageUrl("Browse"), icon: Search },
    { name: "Sell", href: createPageUrl("Sell"), icon: Plus },
    { name: "Wishlist", href: createPageUrl("Wishlist"), icon: Heart },
    { name: "Messages", href: createPageUrl("Messages"), icon: MessageCircle },
    { name: "Cart", href: createPageUrl("Cart"), icon: ShoppingCart, badge: cartCount },
    { name: "Profile", href: createPageUrl("Profile"), icon: UserIcon },
  ];

  const NavLink = ({ item, mobile = false, onClick = () => {} }) => (
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
        location.pathname === item.href
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      } ${mobile ? "w-full" : ""}`}
    >
      <div className="relative">
        <item.icon className="w-5 h-5" />
        {item.badge > 0 && (
          <Badge className="absolute -top-2 -right-2 w-5 h-5 text-xs bg-red-500 text-white border-0 p-0 flex items-center justify-center">
            {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        )}
      </div>
      {item.name}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GadgetFreaks</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <nav className="flex items-center space-x-1">
                {navigation.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </nav>
              <NotificationCenter />
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">GadgetFreaks</span>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="w-5 h-5" />
                    </Button>
                  </SheetClose>
                </div>
                <nav className="space-y-2">
                  {navigation.map((item) => (
                    <NavLink 
                      key={item.name} 
                      item={item} 
                      mobile={true}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* AI Chatbot */}
      <ChatBot />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">GadgetFreaks</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 GadgetFreaks. Buy and sell electronics with confidence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}