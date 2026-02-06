/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Browse from './pages/Browse';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import Listing from './pages/Listing';
import Messages from './pages/Messages';
import MyListings from './pages/MyListings';
import OrderConfirmation from './pages/OrderConfirmation';
import Profile from './pages/Profile';
import Sell from './pages/Sell';
import SellerDashboard from './pages/SellerDashboard';
import Wishlist from './pages/Wishlist';
import Bookings from './pages/Bookings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Browse": Browse,
    "Cart": Cart,
    "Checkout": Checkout,
    "Home": Home,
    "Listing": Listing,
    "Messages": Messages,
    "MyListings": MyListings,
    "OrderConfirmation": OrderConfirmation,
    "Profile": Profile,
    "Sell": Sell,
    "SellerDashboard": SellerDashboard,
    "Wishlist": Wishlist,
    "Bookings": Bookings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};