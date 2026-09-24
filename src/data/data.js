import { generateReviews } from './reviews'
import { importedProducts } from './importedProducts'

const ASSETS_BASE = '/assets/U Seller Store — Shop Premium Products-images'

export const ASSETS = ASSETS_BASE

// Same order as the live store's Categories page.
export const categories = [
  { id: 1, name: 'All', image: '', bgColor: '' },
  { id: 3, name: 'Clothes', image: `${ASSETS_BASE}/clothes.jpg`, bgColor: 'bg-amber-100' },
  { id: 4, name: 'Women Clothes', image: `${ASSETS_BASE}/women-clothes.jpg`, bgColor: 'bg-amber-50' },
  { id: 5, name: 'Remotes', image: `${ASSETS_BASE}/remotes.jpg`, bgColor: 'bg-gray-50' },
  { id: 2, name: 'Under Garments', image: `${ASSETS_BASE}/under-garments.jpg`, bgColor: 'bg-pink-100' },
  { id: 7, name: 'Bags', image: `${ASSETS_BASE}/bags.jpg`, bgColor: 'bg-amber-100' },
  { id: 6, name: 'Women Accessories', image: `${ASSETS_BASE}/women-accessories.jpg`, bgColor: 'bg-amber-50' },
  { id: 8, name: 'Electronics', image: `${ASSETS_BASE}/electronics.jpg`, bgColor: 'bg-gray-200' },
  { id: 9, name: 'Laptops', image: `${ASSETS_BASE}/laptops-cover.png`, bgColor: 'bg-gray-100' },
  { id: 10, name: 'Tablets', image: `${ASSETS_BASE}/tablets-cover.png`, bgColor: 'bg-white' },
  { id: 11, name: 'Mobiles & Accessories', image: `${ASSETS_BASE}/mobiles-accessories.jpg`, bgColor: 'bg-white' },
  { id: 12, name: 'Headphones & Audio', image: `${ASSETS_BASE}/headphones-audio.jpg`, bgColor: 'bg-amber-100' },
  { id: 13, name: 'Keyboards & Mice', image: `${ASSETS_BASE}/keyboards-mice-cover.png`, bgColor: 'bg-white' },
  { id: 14, name: 'Home & Kitchen', image: `${ASSETS_BASE}/home-kitchen.jpg`, bgColor: 'bg-amber-100' },
  { id: 15, name: 'Fashion', image: `${ASSETS_BASE}/fashion.jpg`, bgColor: 'bg-white' },
  { id: 16, name: 'Beauty & Personal Care', image: `${ASSETS_BASE}/beauty-personal-care.jpg`, bgColor: 'bg-pink-100' },
  { id: 17, name: 'Sports & Outdoors', image: `${ASSETS_BASE}/sports-outdoors.jpg`, bgColor: 'bg-white' },
  { id: 18, name: 'Toys & Games', image: `${ASSETS_BASE}/toys-games.jpg`, bgColor: 'bg-amber-50' },
  { id: 19, name: 'Books', image: `${ASSETS_BASE}/books.jpg`, bgColor: 'bg-amber-100' },
  { id: 20, name: 'Health & Wellness', image: `${ASSETS_BASE}/health-wellness.jpg`, bgColor: 'bg-emerald-50' },
  { id: 21, name: 'Office Supplies', image: `${ASSETS_BASE}/office-supplies.jpg`, bgColor: 'bg-gray-100' },
]

export const heroSlides = [
  { id: 1, category: 'FASHION & ACCESSORIES', title: 'Style, perfectly curated', cta: 'Shop the look', to: '/shop?category=Fashion', image: `${ASSETS_BASE}/banner-1-D1oObzR8.jpg` },
  { id: 2, category: 'ELECTRONICS', title: 'Tech that elevates', cta: 'Shop now', to: '/shop?category=Electronics', image: `${ASSETS_BASE}/banner-2-BtfDPfsY.jpg` },
  { id: 3, category: 'HOME & KITCHEN', title: 'Home essentials, redefined', cta: 'Explore', to: '/shop?category=Home%20%26%20Kitchen', image: `${ASSETS_BASE}/banner-3-bKMq95Dw.jpg` },
  { id: 4, category: 'BEAUTY', title: 'Glow from head to toe', cta: 'Discover', to: '/shop?category=Beauty%20%26%20Personal%20Care', image: `${ASSETS_BASE}/banner-4-i-uwyAJB.jpg` },
  { id: 5, category: 'SPORTS', title: 'Gear up for adventure', cta: 'Shop sports', to: '/shop?category=Sports%20%26%20Outdoors', image: `${ASSETS_BASE}/banner-5-DbeJ73Rw.jpg` },
  { id: 6, category: 'DEALS', title: 'Unbeatable prices inside', cta: 'See deals', to: '/shop?sort=price-low', image: `${ASSETS_BASE}/banner-6-2PSYZuiH.jpg` },
]

const S = (label, value) => ({ label, value })

const makeGallery = (img, n = 5) => Array.from({ length: n }, () => img)

const genFeatures = (categoryName) => {
  const pool = {
    'Home & Garden': [
      { title: 'Heavy-Duty Construction', desc: 'Built with premium materials to handle daily wear and tear, year after year. Engineered to hold up under real use without bending, breaking, or losing shape.' },
      { title: 'Quick & Easy Setup', desc: 'Get started in minutes with straightforward instructions and no special tools required. Everything you need for assembly is included right in the box.' },
      { title: 'Space Efficient Design', desc: 'Thoughtful shape and proportions maximize usable surface area while minimizing the footprint. Works beautifully in apartments and tight spaces.' },
      { title: 'Weather Resistant Finish', desc: 'Coated to resist fading, staining, rust and moisture. Suitable for covered patios, decks, garages, and indoor use alike.' },
      { title: '100% Satisfaction Guarantee', desc: 'Backed by our friendly US-based customer support and a full money-back guarantee if you are not completely delighted with your purchase.' }
    ],
    'Health & Wellness': [
      { title: 'Clinically-Studied Ingredients', desc: 'Every active ingredient is selected on the basis of published human clinical research, not marketing hype. Doses match the studies exactly.' },
      { title: 'Third-Party Tested for Purity', desc: 'Independently verified by ISO-certified labs for label accuracy, heavy metals, microbial contaminants, and residual solvents.' },
      { title: 'Gentle & Easy to Tolerate', desc: 'Formulated for sensitive stomachs. May be taken with or without food, at any time of day, without causing gastrointestinal upset.' },
      { title: 'Clean Label, No Junk', desc: 'Zero artificial colors, flavors, sweeteners, stearates, or fillers. Non-GMO, gluten-free, soy-free, and cruelty-free.' },
      { title: 'Generous Multi-Month Supply', desc: 'Each bottle contains a full multi-month supply so you save money per dose and reorder less frequently compared to smaller competitor bottles.' }
    ],
    'Bags': [
      { title: 'Water-Resistant Exterior Fabric', desc: 'Premium woven polyester with a durable water-repellent finish keeps contents dry in sudden rain showers or coffee-spill emergencies.' },
      { title: 'Multi-Compartment Organization', desc: 'Dedicated pockets and sleeves for everything you carry. Never dig around for your keys, phone, pens, or water bottle again.' },
      { title: 'Padded Device Protection', desc: 'Thick shock-absorbing foam padding in the laptop/tablet sleeve guards against bumps and drops during your daily commute.' },
      { title: 'Reinforced Stress Points', desc: 'Bar-tack stitching and reinforced rivets at every handle, strap, and pocket attachment point. Built to carry heavy loads without tearing.' },
      { title: 'Versatile Carry Options', desc: 'Includes top handles plus an adjustable, removable padded shoulder strap. Wear it as a tote, crossbody, or shoulder bag depending on your day.' }
    ],
    'Pet Supplies': [
      { title: 'Safe, Humane Training Technology', desc: 'Uses progressive tone-then-vibration-then-stimulus correction so your dog always has a chance to respond to the mildest signal first.' },
      { title: '100% Waterproof Collar', desc: 'Receiver is fully submersible and rated IPX7. Perfect for water-loving breeds, rainy climates, and backyard pool days.' },
      { title: 'Rechargeable Long-Lasting Battery', desc: 'Collar battery lasts 2-4 weeks between charges via the included USB cable. Low-battery indicator LED lets you know when it is time to top up.' },
      { title: 'Fully Adjustable Correction Levels', desc: 'From tiny 5lb teacup pups to 150lb mastiffs — select from multiple levels of intensity to match your dog\'s size, coat thickness, and temperament.' },
      { title: 'US-Based Customer Support', desc: 'Friendly live pet trainers on staff to help with setup and training questions by phone or email, 6 days a week.' }
    ],
    'Beauty & Personal Care': [
      { title: 'Salon-Quality Professional Formula', desc: 'Developed by celebrity hairstylists and dermatologists. The same premium ingredients used at top spas, now available for at-home use.' },
      { title: 'Sulfate & Paraben Free', desc: 'Gentle, non-stripping base is safe for daily use on color-treated, keratin-treated, relaxed, bleached, and natural hair of all textures.' },
      { title: 'Heat & UV Protection Built In', desc: 'Thermo-protective polymers shield hair up to 450°F during hot tool styling. UV filters help prevent sun-fading of color and dry-out.' },
      { title: 'Cruelty-Free & Vegan', desc: 'Certified cruelty-free by Leaping Bunny and 100% vegan. No animal-derived ingredients and never tested on animals.' },
      { title: 'Luxury Fragrance, Long Lasting', desc: 'Fine-fragrance house scent that lasts up to 48 hours. Subtle, sophisticated, never overpowering — and smells expensive.' }
    ],
    'Fashion': [
      { title: 'Buttery-Soft 4-Way Stretch Fabric', desc: 'Luxurious brushed microfiber blend that moves with you. Squat-proof, bend-proof, and completely opaque — no sheerness, ever.' },
      { title: 'High-Waist Tummy Control', desc: '5" wide double-layered compression waistband smooths the midsection, prevents rolling down, and gives you a flattering silhouette all day long.' },
      { title: 'Deep Side Pockets', desc: 'Two extra-deep side pockets large enough for the largest smartphones, keys, lip balm, gym pass, and even a small snack.' },
      { title: 'No-Roll Flatlock Seams', desc: 'Flat-stitched seams lie completely flat against your skin for zero irritation and no camel toe. Invisible under fitted tops.' },
      { title: 'Machine Washable & Quick Dry', desc: 'Holds shape and color wash after wash. No pilling, no fading, no bagging knees. Tumble dry on low or air dry.' }
    ],
    'Electronics': [
      { title: 'Latest Bluetooth 5.3 Technology', desc: 'Faster pairing, rock-stable connection up to 50ft, lower latency for gaming and video, and improved battery efficiency over older standards.' },
      { title: 'All-Day Battery + Fast Charging', desc: 'Marathon playback on a single charge, and a quick 10-minute top-up gives you hours more music when you are in a pinch. USB-C cable included.' },
      { title: 'Studio-Grade Tuned Audio', desc: 'Tuned by Grammy-winning audio engineers with deep extended bass, a warm natural midrange, and crisp, non-fatiguing treble. Perfect for every genre.' },
      { title: 'IPX7 Waterproof Rated', desc: 'Submersible to 1 meter for up to 30 minutes. Safe in the shower, at the beach, caught in a storm, or during intense sweaty workouts.' },
      { title: 'Touch Controls + Voice Assistant', desc: 'Tap gestures for play/pause, skip tracks, volume, and call handling. Single-pairing to Siri, Google Assistant, and Alexa for hands-free voice commands.' }
    ],
    'Home & Kitchen': [
      { title: 'Food-Grade BPA-Free Materials', desc: 'Every part that touches food is made of LFGB-certified food-safe plastic and silicone. No chemical aftertaste, no BPA, no phthalates.' },
      { title: 'Modular Nesting Design', desc: 'Pieces fit neatly inside each other when not in use, cutting drawer and cabinet clutter by 60% vs. bulky one-piece organizers.' },
      { title: 'Dishwasher Safe & Easy Clean', desc: 'Top-rack dishwasher safe or hand-washes in seconds with warm soapy water. Smooth non-stick surfaces mean food gunk wipes right off.' },
      { title: 'Anti-Slip Stability Base', desc: 'Soft rubberized feet grip countertops and prevent sliding around while you chop, stir, or portion. Silent operation — no scraping sounds.' },
      { title: 'Thoughtful Eco Packaging', desc: 'Shipped in 100% recyclable kraft cardboard with zero single-use plastics. Gift-ready, sustainable, and the planet thanks you.' }
    ],
    'Toys & Games': [
      { title: 'STEM-Learning Focused', desc: 'Every kit introduces real engineering, physics, and mechanical concepts through hands-on play. Kids build real, working contraptions without realizing they are learning.' },
      { title: 'All-Inclusive Kit, No Extra Parts Needed', desc: 'Comes with every brick, string, motor, and specialized piece the projects require. No running to the hardware store mid-build.' },
      { title: 'Step-by-Step Illustrated Manual', desc: '80+ page full-color instruction book with crystal clear 3D exploded diagrams. Kids as young as 8 can follow along independently.' },
      { title: 'Builds Multiple Projects', desc: 'The same set of parts builds not one, but many different machines and gadgets. Hours and hours of repeat play value — not a one-and-done kit.' },
      { title: 'Trusted by Parents & Teachers', desc: 'Used in thousands of classrooms and after-school STEM programs nationwide. Red Dot winner and Teacher\'s Choice award recipient.' }
    ]
  }
  return pool[categoryName] || pool['Home & Garden']
}

const genSpecs = (categoryName, p) => {
  const base = [
    S('Brand', 'U Seller Store Premium'),
    S('Model Number', `USS-${p.id.toString().padStart(4, '0')}`)
  ]
  const pool = {
    'Home & Garden': [...base, S('Material', 'Galvanized Steel + PE Coating'), S('Dimensions', `60" x 48" x 24"`), S('Weight', `${(p.price * 0.12).toFixed(1)} lbs`), S('Assembly', 'Tool-Free 10-Minute'), S('Warranty', '1-Year Manufacturer')],
    'Health & Wellness': [...base, S('Form', 'Coated Tablet / Softgel'), S('Servings', '60-Day Supply'), S('Gluten Free', 'Yes'), S('Non-GMO', 'Yes'), S('Made In', 'USA (GMP Facility)')],
    'Bags': [...base, S('Color', p.id % 2 ? 'Classic Black' : 'Essential Gray'), S('Material', 'Quilted Water-Resistant Polyester'), S('Capacity', '25-35 Liters'), S('Device Pocket', 'Up to 15.6" Laptop'), S('Closure', 'Heavy-Duty YKK Zipper')],
    'Pet Supplies': [...base, S('Pet Weight', '5 lbs +'), S('Coverage Area', 'Up to ½ Acre'), S('Waterproof', 'IPX7 Submersible'), S('Battery Life', '2-4 Weeks / Charge'), S('Collar Neck Fit', '6" to 28"')],
    'Beauty & Personal Care': [...base, S('Size', `${p.id % 2 ? 5.6 : 8} fl oz`), S('Hair Type', 'All Types, Color Safe'), S('Hold', 'Flexible / Natural'), S('Cruelty Free', 'Leaping Bunny Certified'), S('Vegan', 'Yes, 100%')],
    'Fashion': [...base, S('Fabric', '88% Nylon / 12% Spandex'), S('Waist Rise', 'High Rise (5" Band)'), S('Inseam', '25" Full Length'), S('Care', 'Machine Wash Cold'), S('Sizes Available', 'XS through 3XL')],
    'Electronics': [...base, S('Connectivity', 'Bluetooth 5.3'), S('Battery Life', `${24 + p.id} hrs (case) / 8 hrs (earbuds)`), S('Charging', 'USB-C + Wireless Case'), S('Waterproof', 'IPX7 (Earbuds)'), S('Codecs', 'SBC / AAC / aptX')],
    'Home & Kitchen': [...base, S('Pieces Included', '8-Piece Set'), S('Materials', 'BPA-Free Food-Grade Plastic + Silicone'), S('Dishwasher Safe', 'Yes, Top Rack'), S('Microwave Safe', 'Yes (Up to 3 Min)'), S('Warranty', 'Lifetime Satisfaction')],
    'Toys & Games': [...base, S('Age Range', '8 Years and Up'), S('Pieces', `${60 + p.id * 3}`), S('Projects', `${5 + (p.id % 5)} Different Builds`), S('Batteries Required', p.id % 2 ? '3x AAA (Not Included)' : 'None'), S('Awards', 'Teacher\'s Choice Award')]
  }
  return pool[categoryName] || base.concat([S('Category', categoryName), S('Shipping', 'Fast & Free US'), S('Returns', '30-Day Hassle-Free')])
}

const slugify = (id, name) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}${id}`

const mapCategory = (id) => {
  const m = {
    1: 'Home & Garden', 2: 'Health & Wellness', 3: 'Bags', 4: 'Pet Supplies', 5: 'Beauty & Personal Care',
    6: 'Toys & Games', 7: 'Home & Kitchen', 8: 'Beauty & Personal Care', 9: 'Home & Garden', 10: 'Home & Garden',
    11: 'Fashion', 12: 'Home & Kitchen', 13: 'Fashion', 14: 'Electronics', 15: 'Fashion', 16: 'Beauty & Personal Care',
    17: 'Fashion', 18: 'Electronics', 19: 'Electronics', 20: 'Home & Kitchen', 21: 'Fashion', 22: 'Beauty & Personal Care',
    23: 'Fashion', 24: 'Electronics', 25: 'Pet Supplies', 26: 'Home & Garden', 27: 'Electronics', 28: 'Electronics',
    29: 'Fashion', 30: 'Fashion'
  }
  return m[id] || 'General'
}

const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const buildAllProducts = () => {
  const rawList = [
    { id: 1, name: 'Cucumber Trellis for Raised Bed', price: 22.94, oldPrice: 26.99, discount: 15, rating: 4.8, reviewCount: 296, image: `${ASSETS_BASE}/61-f6JORKlL._AC_SL400_.jpg` },
    { id: 2, name: 'Move Free Ultra Triple Action Joint Support Supplement', price: 26.49, oldPrice: 32.99, discount: 20, rating: 4.5, reviewCount: 100, image: `${ASSETS_BASE}/61A4DjEFGqL._AC_SL400_.jpg` },
    { id: 3, name: 'RAINSMORE Teacher Tote Bag with Insulated Lunch Compartment 15.6 inch Laptop Bag', price: 31.99, oldPrice: 35.99, discount: 11, rating: 4.7, reviewCount: 181, image: `${ASSETS_BASE}/71bYn2Iz66L._AC_SL400_.jpg` },
    { id: 4, name: 'PetSafe Wireless Pet Containment System', price: 166.46, oldPrice: 199.99, discount: 17, rating: 4.5, reviewCount: 241, image: `${ASSETS_BASE}/71moLqLHE3L._AC_SL400_.jpg` },
    { id: 5, name: 'Cake Beauty Big Wig Dry Texturizing Spray, 5.6 oz', price: 11.49, oldPrice: null, discount: null, rating: 4.3, reviewCount: 189, image: `${ASSETS_BASE}/81EttkWfOWL._AC_SL400_.jpg` },
    { id: 6, name: 'Klutz Lego Chain Reactions Craft Kit', price: 21.99, oldPrice: 24.50, discount: 10, rating: 4.8, reviewCount: 520, image: `${ASSETS_BASE}/919hY7wsENL._AC_SL400_.jpg` },
    { id: 7, name: 'Bathroom Organizer Shelf Wall Mounted', price: 19.99, oldPrice: 23.49, discount: 15, rating: 4.4, reviewCount: 89, image: `${ASSETS_BASE}/71mAY-c1uCL._AC_SL400_.jpg` },
    { id: 8, name: 'Amika Soulfood Nourishing Mask', price: 28.00, oldPrice: null, discount: null, rating: 4.6, reviewCount: 342, image: `${ASSETS_BASE}/B1ieKaTDQdL._CLa_2140,2000_71uzWLH2ZnL.png_0,0,2140,2000+0.0,0.0,2140.0,2000.0_AC_SL1500_.jpg` },
    { id: 9, name: 'MOLOTOW ONE4ALL Acrylic Paint Marker Set', price: 34.95, oldPrice: 59.99, discount: 42, rating: 4.7, reviewCount: 156, image: `${ASSETS_BASE}/71VwdTd7CkL._AC_SL400_.jpg` },
    { id: 10, name: 'Mosquito Repellent Incense Sticks 240 PCS', price: 14.99, oldPrice: null, discount: null, rating: 4.2, reviewCount: 78, image: `${ASSETS_BASE}/81gDNky5AzL._AC_SL400_.jpg` },
    { id: 11, name: 'IRAMY Ankle Compression Socks for Women Men Plantar Fasciitis', price: 11.99, oldPrice: 14.99, discount: 20, rating: 4.3, reviewCount: 283, image: `${ASSETS_BASE}/511WMEJqL-L._AC_SL400_.jpg` },
    { id: 12, name: 'BrüMate BrüMate Era 40 oz Tumbler with Handle & Straw', price: 44.99, oldPrice: null, discount: null, rating: 4.5, reviewCount: 285, image: `${ASSETS_BASE}/51XwcDfG-rL._AC_SL400_.jpg` },
    { id: 13, name: 'NexiEpoch 4 Pack Leggings for Women', price: 18.97, oldPrice: 22.59, discount: 16, rating: 4.9, reviewCount: 130, image: `${ASSETS_BASE}/61ZG2-DsZJL._AC_SL400_.jpg` },
    { id: 14, name: 'LZYYOO Leggings with Pockets for Women', price: 33.99, oldPrice: 39.99, discount: 15, rating: 4.7, reviewCount: 173, image: `${ASSETS_BASE}/7178hKagwTL._AC_SL400_.jpg` },
    { id: 15, name: 'Chunful 10 Pieces Inspirational Canvas Makeup Bags for Women', price: 12.99, oldPrice: 13.99, discount: 7, rating: 5.0, reviewCount: 1, image: `${ASSETS_BASE}/71AmFpmk6NL._AC_SL400_.jpg` },
    { id: 16, name: 'Kitsch Heat Protectant Spray for Hair', price: 16.00, oldPrice: 20.00, discount: 20, rating: 4.6, reviewCount: 412, image: `${ASSETS_BASE}/71DojYx319L._AC_SL400_.jpg` },
    { id: 17, name: 'RSOTC Cross Body Bag for Women Bum Bag Checkered Belt Bag', price: 19.99, oldPrice: null, discount: null, rating: 5.0, reviewCount: 1, image: `${ASSETS_BASE}/71K-pGRhMsL._AC_SL400_.jpg` },
    { id: 18, name: 'VIPERTEK VTS-880 Mini Stun Gun for Self Defense Rechargeable', price: 10.99, oldPrice: null, discount: null, rating: 4.5, reviewCount: 113, image: `${ASSETS_BASE}/71NYeTbPEKL._AC_SL400_.jpg` },
    { id: 19, name: 'Elegant Sleeveless Midi Dress for Women', price: 29.99, oldPrice: null, discount: null, rating: 4.3, reviewCount: 87, image: `${ASSETS_BASE}/71bhhmijHRL._AC_SL400_.jpg` },
    { id: 20, name: 'Tangle Teezer Ultimate Detangler Hairbrush Wet & Dry Hair', price: 14.99, oldPrice: null, discount: null, rating: 4.8, reviewCount: 1024, image: `${ASSETS_BASE}/7a7ac49a-84ec-4c17-bb95-04f0c20ad97a.png` },
    { id: 21, name: 'Sarcastic Quote Knower of Stuff Fixer of Things T-Shirt', price: 15.29, oldPrice: 17.99, discount: 15, rating: 4.9, reviewCount: 92, image: `${ASSETS_BASE}/619kDYLboUL._AC_SL400_.jpg` },
    { id: 22, name: 'H.ebony 5Pcs Stranger 5 Keychains for Women Men', price: 11.99, oldPrice: 12.99, discount: 8, rating: 4.9, reviewCount: 147, image: `${ASSETS_BASE}/61F3SJPL8VL._AC_SL400_.jpg` },
    { id: 23, name: 'Veken 8 Set Packing Cubes for Travel Luggage Organizers', price: 17.99, oldPrice: 22.99, discount: 22, rating: 4.8, reviewCount: 145, image: `${ASSETS_BASE}/61uH-BSPnHL._AC_SL400_.jpg` },
    { id: 24, name: 'uekeboag Large Travel Quilted Makeup Bag for Women', price: 13.59, oldPrice: 15.99, discount: 15, rating: 4.5, reviewCount: 187, image: `${ASSETS_BASE}/71OA7gz0e1L._AC_SL400_.jpg` },
    { id: 25, name: 'VIPERTEK VTS-880 Mini Stun Gun Rechargeable LED Flashlight', price: 10.99, oldPrice: null, discount: null, rating: 4.5, reviewCount: 113, image: `${ASSETS_BASE}/71NYeTbPEKL._AC_SL400_.jpg` },
    { id: 26, name: 'Folding Utility Knife Heavy Duty Box Cutter', price: 8.99, oldPrice: 11.99, discount: 25, rating: 4.6, reviewCount: 203, image: `${ASSETS_BASE}/71xlsrz3PvL._AC_SL400_.jpg` },
    { id: 27, name: 'Portable Bluetooth Speaker Waterproof Outdoor', price: 39.99, oldPrice: 49.99, discount: 20, rating: 4.7, reviewCount: 892, image: 'https://m.media-amazon.com/images/I/71jjggEx2XL._AC_SL400_.jpg', gallery: ['https://m.media-amazon.com/images/I/71jjggEx2XL._AC_SL400_.jpg', 'https://m.media-amazon.com/images/I/71H96W3JhwL._AC_SL400_.jpg', 'https://m.media-amazon.com/images/I/61TZoiG2nhL._AC_SL400_.jpg', 'https://m.media-amazon.com/images/I/71axiGLkw1L._AC_SL400_.jpg', 'https://m.media-amazon.com/images/I/71jjggEx2XL._AC_SL400_.jpg'] },
    { id: 28, name: 'Wireless Earbuds Bluetooth 5.3 Headphones Noise Cancelling', price: 24.99, oldPrice: 34.99, discount: 29, rating: 4.4, reviewCount: 1560, image: 'https://m.media-amazon.com/images/I/71sWRy5QxIL._AC_SL400_.jpg', gallery: ['https://m.media-amazon.com/images/I/71sWRy5QxIL._AC_SL400_.jpg', 'https://m.media-amazon.com/images/I/716uLGLoj9L._AC_SL400_.jpg', 'https://m.media-amazon.com/images/I/71NMUHszF4L._AC_SL400_.jpg', 'https://m.media-amazon.com/images/I/61KVAfSonkL._AC_SL400_.jpg', 'https://m.media-amazon.com/images/I/51VxSqysy6L._AC_SL400_.jpg'] },
    { id: 29, name: 'linccure Seamless G-string Thongs for Women 6 Pack', price: 14.24, oldPrice: 19.99, discount: 29, rating: 4.5, reviewCount: 152, image: `${ASSETS_BASE}/619kDYLboUL._AC_SL400_.jpg` },
    { id: 30, name: 'Take Talk Womens Underwear Seamless Hipster Briefs', price: 12.99, oldPrice: 19.99, discount: 35, rating: 4.9, reviewCount: 177, image: `${ASSETS_BASE}/61uH-BSPnHL._AC_SL400_.jpg` },
    { id: 31, name: 'mibasies 2 PCS Initial Makeup Bags Mothers Day Gifts', price: 22.99, oldPrice: null, discount: null, rating: 4.0, reviewCount: 1, image: `${ASSETS_BASE}/71bYn2Iz66L._AC_SL400_.jpg` },
    { id: 32, name: 'Omega Seamaster Diver Automatic 300M Watch', price: 5320.00, oldPrice: null, discount: null, rating: 4.7, reviewCount: 26, image: `${ASSETS_BASE}/61A4DjEFGqL._AC_SL400_.jpg` },
    { id: 33, name: 'Omega Seamaster Diver Chronometer Co-Axial', price: 10500.00, oldPrice: null, discount: null, rating: 5.0, reviewCount: 48, image: `${ASSETS_BASE}/61A4DjEFGqL._AC_SL400_.jpg` },
    { id: 34, name: 'Omega Men\'s Speedmaster Professional Moonwatch', price: 4720.00, oldPrice: null, discount: null, rating: 4.8, reviewCount: 23, image: `${ASSETS_BASE}/61A4DjEFGqL._AC_SL400_.jpg` },
    { id: 36, name: 'Samsung 85 Inch Neo QLED 8K Smart TV', price: 6469.00, oldPrice: 7520.00, discount: 14, rating: 4.8, reviewCount: 88, image: `${ASSETS_BASE}/electronics.jpg` },
  ]

  const generated = rawList.map(p => {
    const cat = mapCategory(p.id)
    const realReviewCount = Math.max(55, p.reviewCount + Math.floor(Math.random() * 160))
    return {
      ...p,
      reviewCount: realReviewCount,
      reviews: generateReviews(realReviewCount, p.rating),
      category: cat,
      slug: slugify(p.id, p.name),
      gallery: p.gallery || makeGallery(p.image, 5),
      features: genFeatures(cat),
      specifications: genSpecs(cat, p),
      inStock: true,
      wishlist: false,
      breadcrumb: ['Home', 'Shop', cat]
    }
  })

  // importedProducts.js holds the categories copied from the live store as-is (prices, counts,
  // descriptions, reviews), so they skip the generated reviews/features above. Their gallery,
  // description sections and reviews load on demand per product (see loadStoredProductData).
  const imported = importedProducts.map(p => ({ ...p, wishlist: false, breadcrumb: ['Home', 'Shop', p.category], reviews: [], hasStoredData: true }))

  // A few of the original products are the same listings that now arrive from the live catalogue.
  // The live version takes over: it keeps the original's slot on the home page and the shop
  // shows it once instead of twice.
  const importedKeys = imported.map(p => [normalizeName(p.name), p])
  const twinOf = (p) => {
    const key = normalizeName(p.name)
    if (key.length < 20) return null
    const matches = importedKeys
      .filter(([other]) => other.startsWith(key) || key.startsWith(other))
      .map(([, imp]) => imp)
    return matches.find(imp => imp.price === p.price) ?? matches[0] ?? null
  }
  const twins = new Map(generated.map(p => [String(p.id), twinOf(p)]))

  return {
    all: [...generated.filter(p => !twins.get(String(p.id))), ...imported],
    home: generated.map(p => twins.get(String(p.id)) ?? p),
    replacedBy: new Map([...twins].filter(([, twin]) => twin)),
  }
}

// Per-product gallery, description sections and reviews for imported products live in
// public/imported-data/<id>.json (plain static files, fetched when a product page opens).
const emptyStoredData = { gallery: null, detailSections: [], reviews: [] }

export const loadStoredProductData = (product) =>
  fetch(`${import.meta.env.BASE_URL}imported-data/${product.id}.json`)
    .then(res => (res.ok ? res.json() : emptyStoredData))
    .catch(() => emptyStoredData)

const built = buildAllProducts()

export const allProducts = built.all

const flat = allProducts

export const products = {
  editorsPicks: built.home.slice(0, 10),
  trending: built.home.slice(10, 20),
  bestSellers: built.home.slice(20, 30),
}

// Old ids of the replaced originals still resolve, to their live version.
export const findProductById = (id) => flat.find(p => String(p.id) === String(id)) ?? built.replacedBy.get(String(id))
export const findProductBySlug = (slug) => flat.find(p => p.slug === slug)
export const getRelatedProducts = (product, count = 5) => {
  const sameCat = flat.filter(p => String(p.id) !== String(product.id) && p.category === product.category)
  const pool = sameCat.length >= count ? sameCat : flat.filter(p => String(p.id) !== String(product.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export default allProducts
