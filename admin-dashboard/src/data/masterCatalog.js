// Master catalog of products every verified seller can pick from to stock their shop.
// Each entry carries the wholesale cost (what the seller pays U Seller Store) and the
// suggested retail sell price shown to the seller's own customers.
//
// Kept in lockstep with src/data/masterCatalog.js in the main storefront app (same ids, same
// order) so a seller's stocked products resolve to the same catalog entry here when the admin
// places an order. Once a seller's KYC is approved they can add any of these to their shop; the
// admin then orders against whatever a seller has stocked. Beyond the hand-curated starter list
// below, every product sold on the storefront (imported from the live catalogue in
// importedProducts.js — ~4,900 items across 20 categories) is also added to the catalog, so a
// seller can stock essentially anything a customer can buy.

import { importedProducts } from './importedProducts'

const ASSETS_BASE = '/assets/U Seller Store — Shop Premium Products-images'

const raw = [
  // Home & Kitchen
  { name: 'Kuhome Over The Door Hooks, Towel Holder for Bathroom, Door Mount Towel Rack Towel Hooks for Bedroom Beach Towels Bathrobe Wall Mount Hang on The Door', category: 'Home & Kitchen', cost: 9.59, sell: 11.99, image: `${ASSETS_BASE}/61-f6JORKlL._AC_SL400_.jpg` },
  { name: 'MELLCOM 7 Piece Patio Furniture Set, Wicker Patio Conversation Set with Swivel Glider, Loveseat Sofa, 2 Ottomans, Side Table and Coffee Table for Deck Backyard', category: 'Home & Kitchen', cost: 311.39, sell: 419.99, image: `${ASSETS_BASE}/71bhhmijHRL._AC_SL400_.jpg` },
  { name: 'Yaheetech Filing Cabinet Lateral File Cabinet with 2 Drawer and 4 Open Compartments for Letter Size A4 Size, Printer Stand for Home Office, Black/Rustic Brown', category: 'Home & Kitchen', cost: 49.91, sell: 62.99, image: `${ASSETS_BASE}/71bYn2Iz66L._AC_SL400_.jpg` },
  { name: 'SUPERJARE Large Bakers Rack with Power Outlets, 6-Tier Microwave Stand, Coffee Bar with 12 S-Shaped Hooks, Kitchen Storage Shelf for Home Office', category: 'Home & Kitchen', cost: 78.56, sell: 99.99, image: `${ASSETS_BASE}/71DojYx319L._AC_SL400_.jpg` },
  { name: 'Lufeiya White L Shaped Computer Desk with Drawers and Storage Shelves, 47 Inch Corner Reversible Desk with Monitor Stand for Home Office', category: 'Home & Kitchen', cost: 70.87, sell: 89.99, image: `${ASSETS_BASE}/71AmFpmk6NL._AC_SL400_.jpg` },
  { name: 'HiGift Plant Support Stakes, 6 Pack Metal Peony Cages and Supports, Garden Stakes Plant Support Cage, Large Plant Support Ring for Outdoor Indoor Snake Plants', category: 'Sports & Outdoors', cost: 13.92, sell: 16.99, image: `${ASSETS_BASE}/7178hKagwTL._AC_SL400_.jpg` },
  { name: 'Homde Wall Mounted Jewelry Organizer with Mirror, Rustic Wood Jewelry Cabinet Armoire, Lockable Jewelry Box with Full Length Mirror for Bedroom', category: 'Home & Kitchen', cost: 34.20, sell: 44.99, image: `${ASSETS_BASE}/61ZG2-DsZJL._AC_SL400_.jpg` },
  { name: 'HOMFA 5 Drawer Dresser, Fabric Storage Tower with Wood Top, Sturdy Steel Frame Closet Organizer for Bedroom Nursery Closet', category: 'Home & Kitchen', cost: 41.63, sell: 54.99, image: `${ASSETS_BASE}/61F3SJPL8VL._AC_SL400_.jpg` },

  // Tablets & Electronics
  { name: 'Android 15 Tablet 10 inch Tablet 2 IN 1 Tablets with Keyboard Mouse Case Stylus 18GB RAM 128GB ROM 2TB Expand, Android 15 Tablets 10.1" IPS 6000mAh', category: 'Tablets', cost: 57.67, sell: 72.95, image: `${ASSETS_BASE}/61A4DjEFGqL._AC_SL400_.jpg` },
  { name: 'Roku Voice Remote | Replacement TV Remote Control with Voice Control, Simple Setup, & Pre-Set App Shortcut Buttons', category: 'Remotes', cost: 15.90, sell: 19.88, image: `${ASSETS_BASE}/511WMEJqL-L._AC_SL400_.jpg` },
  { name: 'Samsung 85 Inch Neo QLED 8K Smart TV with Quantum HDR and Object Tracking Sound Pro', category: 'Electronics', cost: 5183.20, sell: 6469.00, image: `${ASSETS_BASE}/619kDYLboUL._AC_SL400_.jpg` },
  { name: 'Apple 16-Inch MacBook Pro Laptop Early 2024 M3 Max Chip, Liquid Retina XDR Display', category: 'Laptops', cost: 6584.00, sell: 8230.00, image: `${ASSETS_BASE}/51XwcDfG-rL._AC_SL400_.jpg` },

  // Keyboards & Mice
  { name: 'Logitech G502 Lightspeed Wireless Gaming Mouse with Hero 25K Sensor, PowerPlay Compatible, Tunable Weights', category: 'Keyboards & Mice', cost: 64.51, sell: 81.99, image: `${ASSETS_BASE}/71bhhmijHRL._AC_SL400_.jpg` },
  { name: 'Logitech MX Keys Advanced Wireless Illuminated Keyboard, Backlit, Smart Illumination, USB-C, Bluetooth', category: 'Keyboards & Mice', cost: 79.20, sell: 99.99, image: `${ASSETS_BASE}/61uH-BSPnHL._AC_SL400_.jpg` },

  // Mobiles & Accessories
  { name: 'MagSafe Compatible Clear Phone Case with Card Holder, Shockproof Protective Cover with Built-in Magnet', category: 'Mobiles & Accessories', cost: 8.10, sell: 12.99, image: `${ASSETS_BASE}/61ZG2-DsZJL._AC_SL400_.jpg` },
  { name: '20000mAh Portable Charger Power Bank, Fast Charging Battery Pack with USB-C Input/Output for iPhone Samsung', category: 'Mobiles & Accessories', cost: 17.44, sell: 22.99, image: `${ASSETS_BASE}/71OA7gz0e1L._AC_SL400_.jpg` },

  // Headphones & Audio
  { name: 'Anker Soundcore Life Q30 Hybrid Active Noise Cancelling Headphones, Hi-Res Audio, 40H Playtime', category: 'Headphones & Audio', cost: 46.30, sell: 59.99, image: `${ASSETS_BASE}/71xlsrz3PvL._AC_SL400_.jpg` },
  { name: 'JBL Flip 6 Portable Waterproof Bluetooth Speaker with Powerful Sound and Deep Bass', category: 'Headphones & Audio', cost: 84.10, sell: 109.95, image: `${ASSETS_BASE}/81BqfCWvzxL._AC_SL400_.jpg` },

  // Bags
  { name: 'Travelpro Maxlite 5 Softside Expandable Rollaboard Carry-On Luggage, Lightweight Suitcase', category: 'Bags', cost: 68.90, sell: 89.99, image: `${ASSETS_BASE}/71cHiwCmk+L._AC_SL400_.jpg` },
  { name: 'Herschel Classic Mid-Volume Backpack, Durable Everyday Travel Bag with Laptop Sleeve', category: 'Bags', cost: 31.20, sell: 39.99, image: `${ASSETS_BASE}/91Wg+o7d34L._AC_SL400_.jpg` },

  // Women Accessories / Clothes
  { name: 'PAVOI 14K Gold Plated Cubic Zirconia Hoop Earrings, Hypoallergenic Sterling Silver Post Huggie Earrings', category: 'Women Accessories', cost: 10.55, sell: 14.99, image: `${ASSETS_BASE}/61W+hqYydQL._AC_SL400_.jpg` },
  { name: 'Amazon Essentials Women\'s Classic-Fit Long-Sleeve Crewneck Sweater, Soft Everyday Knit', category: 'Women Clothes', cost: 12.80, sell: 17.99, image: `${ASSETS_BASE}/61v3ZQL+FzL._AC_SL400_.jpg` },
  { name: 'Hanes Men\'s ComfortSoft Crewneck T-Shirt (6-Pack), Tagless Everyday Cotton Tee', category: 'Clothes', cost: 14.30, sell: 19.99, image: `${ASSETS_BASE}/71Frl87nB4L._AC_SL400_.jpg` },
  { name: 'Fruit of the Loom Men\'s Coolzone Boxer Briefs, Breathable Moisture Wicking Underwear (6-Pack)', category: 'Under Garments', cost: 15.40, sell: 21.99, image: `${ASSETS_BASE}/71F3SJPL8VL._AC_SL400_.jpg` },

  // Beauty & Personal Care
  { name: 'CeraVe Moisturizing Facial Cleanser with Hyaluronic Acid and Ceramides, Fragrance Free', category: 'Beauty & Personal Care', cost: 9.10, sell: 12.99, image: `${ASSETS_BASE}/61F3SJPL8VL._AC_SL400_.jpg` },
  { name: 'Revlon One-Step Volumizer Hair Dryer and Hot Air Brush, Oval Design for Smooth Silky Results', category: 'Beauty & Personal Care', cost: 33.60, sell: 44.99, image: `${ASSETS_BASE}/71xlsrz3PvL._AC_SL400_.jpg` },

  // Toys & Games
  { name: 'Melissa & Doug Wooden Building Blocks Set, 100 Piece Classic Wood Block Set in Storage Box', category: 'Toys & Games', cost: 18.75, sell: 24.99, image: `${ASSETS_BASE}/71OA7gz0e1L._AC_SL400_.jpg` },
  { name: 'Catan Board Game, Strategy Board Game for Adults and Family Game Night, 3-4 Players', category: 'Toys & Games', cost: 34.90, sell: 44.99, image: `${ASSETS_BASE}/91Wg+o7d34L._AC_SL400_.jpg` },

  // Books
  { name: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones (Hardcover)', category: 'Books', cost: 11.20, sell: 15.99, image: `${ASSETS_BASE}/71cHiwCmk+L._AC_SL400_.jpg` },
  { name: 'The Ultimate Sticker & Coloring Activity Book for Kids Ages 4-8, 200+ Pages of Fun', category: 'Books', cost: 6.10, sell: 8.99, image: `${ASSETS_BASE}/81BqfCWvzxL._AC_SL400_.jpg` },

  // Sports & Outdoors
  { name: 'REI Co-op Trailmade 2-Person Backpacking Tent, Lightweight 3-Season Camping Tent', category: 'Sports & Outdoors', cost: 79.40, sell: 104.99, image: `${ASSETS_BASE}/7178hKagwTL._AC_SL400_.jpg` },
  { name: 'Bala Bangles 1lb Wearable Ankle & Wrist Weights, Adjustable Strength Training Set (Pair)', category: 'Sports & Outdoors', cost: 22.30, sell: 29.99, image: `${ASSETS_BASE}/61-f6JORKlL._AC_SL400_.jpg` },

  // Fashion
  { name: 'Ray-Ban Wayfarer Classic Polarized Sunglasses, UV400 Protection Acetate Frame', category: 'Fashion', cost: 62.10, sell: 79.99, image: `${ASSETS_BASE}/61W+hqYydQL._AC_SL400_.jpg` },
  { name: 'Fossil Grant Men\'s Chronograph Stainless Steel Quartz Watch with Leather Band', category: 'Fashion', cost: 84.30, sell: 109.99, image: `${ASSETS_BASE}/61v3ZQL+FzL._AC_SL400_.jpg` },

  // Watches (higher-value catalog items)
  { name: 'Omega Seamaster Diver 300M Automatic Chronometer, Ceramic Bezel, 42mm Steel Case', category: 'Fashion', cost: 8400.00, sell: 10500.00, image: `${ASSETS_BASE}/61A4DjEFGqL._AC_SL400_.jpg` },
  { name: 'Omega Men\'s Speedmaster Professional Moonwatch Chronograph, Hesalite Crystal', category: 'Fashion', cost: 3776.00, sell: 4720.00, image: `${ASSETS_BASE}/61A4DjEFGqL._AC_SL400_.jpg` },

  // More Home & Kitchen
  { name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker, 6 Quart Slow Cooker Rice Cooker Steamer', category: 'Home & Kitchen', cost: 63.20, sell: 79.99, image: `${ASSETS_BASE}/71bhhmijHRL._AC_SL400_.jpg` },
  { name: 'Ninja Air Fryer Max XL, 5.5 Quart Nonstick Basket, 5 One-Touch Cooking Programs', category: 'Home & Kitchen', cost: 79.90, sell: 99.99, image: `${ASSETS_BASE}/71DojYx319L._AC_SL400_.jpg` },
  { name: 'Keurig K-Classic Coffee Maker, Single Serve K-Cup Pod Brewer, 6 to 10 Oz Brew Size', category: 'Home & Kitchen', cost: 71.10, sell: 89.99, image: `${ASSETS_BASE}/71bYn2Iz66L._AC_SL400_.jpg` },
  { name: 'Utopia Bedding Queen Sheet Set, 4 Piece Brushed Microfiber Bed Sheets, Deep Pocket', category: 'Home & Kitchen', cost: 19.90, sell: 26.99, image: `${ASSETS_BASE}/61ZG2-DsZJL._AC_SL400_.jpg` },
  { name: 'Rubbermaid Brilliance Food Storage Container Set, 20 Piece Set with Leak-Proof Lids', category: 'Home & Kitchen', cost: 27.60, sell: 36.99, image: `${ASSETS_BASE}/71bhhmijHRL._AC_SL400_.jpg` },

  // More Tablets / Electronics
  { name: 'Amazon Fire HD 10 Tablet, 10.1" 1080p Full HD, 32 GB, Latest Model with Alexa Hands-Free', category: 'Tablets', cost: 74.30, sell: 94.99, image: `${ASSETS_BASE}/61A4DjEFGqL._AC_SL400_.jpg` },
  { name: 'Ring Video Doorbell, 1080p HD Video, Two-Way Talk, Motion Detection, Easy Installation', category: 'Electronics', cost: 62.30, sell: 79.99, image: `${ASSETS_BASE}/619kDYLboUL._AC_SL400_.jpg` },
  { name: 'TP-Link AX3000 WiFi 6 Router, Dual Band Gigabit Wireless Internet Router with OFDMA', category: 'Electronics', cost: 68.40, sell: 89.99, image: `${ASSETS_BASE}/619kDYLboUL._AC_SL400_.jpg` },
  { name: 'ASUS Vivobook 15 Laptop, 15.6" FHD Display, Intel Core i5, 8GB RAM, 512GB SSD', category: 'Laptops', cost: 439.20, sell: 549.00, image: `${ASSETS_BASE}/51XwcDfG-rL._AC_SL400_.jpg` },

  // More Keyboards & Mice
  { name: 'Razer BlackWidow V4 Mechanical Gaming Keyboard, Green Clicky Switches, RGB Backlit', category: 'Keyboards & Mice', cost: 111.90, sell: 139.99, image: `${ASSETS_BASE}/61uH-BSPnHL._AC_SL400_.jpg` },
  { name: 'Logitech MX Master 3S Wireless Mouse, Ultra-Fast Scrolling, Quiet Clicks, USB-C', category: 'Keyboards & Mice', cost: 79.90, sell: 99.99, image: `${ASSETS_BASE}/71bhhmijHRL._AC_SL400_.jpg` },

  // More Mobiles & Accessories
  { name: 'Anker 65W USB-C Fast Charger, 3-Port GaN Wall Charger for Laptop Phone Tablet', category: 'Mobiles & Accessories', cost: 22.40, sell: 29.99, image: `${ASSETS_BASE}/71OA7gz0e1L._AC_SL400_.jpg` },
  { name: 'OtterBox Defender Series Case for iPhone, Rugged Protective Case with Belt Clip Holster', category: 'Mobiles & Accessories', cost: 27.90, sell: 36.99, image: `${ASSETS_BASE}/61ZG2-DsZJL._AC_SL400_.jpg` },

  // More Sports & Outdoors
  { name: 'YETI Rambler 26 oz Bottle, Vacuum Insulated Stainless Steel with Chug Cap', category: 'Sports & Outdoors', cost: 32.00, sell: 42.00, image: `${ASSETS_BASE}/7178hKagwTL._AC_SL400_.jpg` },
  { name: 'TheraBand Resistance Bands Set, 5 Strength Levels with Door Anchor and Carry Bag', category: 'Sports & Outdoors', cost: 14.60, sell: 19.99, image: `${ASSETS_BASE}/61-f6JORKlL._AC_SL400_.jpg` },

  // More Toys & Games
  { name: 'LEGO Classic Creative Bricks Box, 484 Piece Building Toy Set for Kids Ages 4+', category: 'Toys & Games', cost: 27.90, sell: 36.99, image: `${ASSETS_BASE}/71OA7gz0e1L._AC_SL400_.jpg` },
  { name: 'Hasbro Monopoly Classic Board Game, Family Board Game for 2-6 Players Ages 8+', category: 'Toys & Games', cost: 15.30, sell: 19.99, image: `${ASSETS_BASE}/91Wg+o7d34L._AC_SL400_.jpg` },

  // More Beauty
  { name: 'Olaplex No. 3 Hair Perfector, Repairing Hair Treatment for Damaged and Color-Treated Hair', category: 'Beauty & Personal Care', cost: 21.90, sell: 28.99, image: `${ASSETS_BASE}/71xlsrz3PvL._AC_SL400_.jpg` },
]

const curated = raw.map((item, index) => ({
  id: `cat-${index + 1}`,
  ...item,
}))

// Wholesale cost isn't tracked separately for the storefront's live catalogue, so it's estimated
// at a 20% margin off the retail ("sell") price the customer pays — in line with the curated list above.
const SELLER_MARGIN = 0.8

const imported = importedProducts.map((item) => ({
  id: `imp-${item.id}`,
  name: item.name,
  category: item.category,
  cost: Math.round(item.price * SELLER_MARGIN * 100) / 100,
  sell: item.price,
  image: item.image,
}))

export const masterCatalog = [...curated, ...imported]

export const catalogCategories = ['All categories', ...Array.from(new Set(masterCatalog.map((item) => item.category)))]

// A seller's shop stores product ids (`seller.productIds`) and resolves them against this catalog on
// every render — with ~5,000 entries, scanning the array per id (Array.find) adds up fast. Callers that
// resolve ids should use this map (O(1) per id) instead of masterCatalog.find(...).
export const catalogById = new Map(masterCatalog.map((item) => [item.id, item]))

export const findCatalogProduct = (id) => catalogById.get(id)
