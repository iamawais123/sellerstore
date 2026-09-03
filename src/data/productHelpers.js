const ASSETS_BASE = '/assets/U Seller Store — Shop Premium Products-images'

const createSpecs = (specs) => Object.entries(specs).map(([label, value]) => ({ label, value }))

const buildProduct = (base, extra = {}) => ({
  ...base,
  inStock: true,
  category: extra.category || 'General',
  slug: base.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  gallery: extra.gallery || [base.image, base.image, base.image, base.image, base.image],
  features: extra.features || [],
  specifications: extra.specifications ? createSpecs(extra.specifications) : [],
  reviewCount: extra.reviewCount || (60 + Math.floor(Math.random() * 180))
})

const editorFeaturesSpecs = {
  1: {
    category: 'Home & Garden',
    features: [
      { title: 'Heavy Duty Steel Frame', desc: 'Constructed with rust-resistant galvanized steel tubing that won\'t bend under the weight of mature cucumber and squash vines. The powder-coated finish stands up to rain, sun, and humidity season after season.' },
      { title: 'Vertical Space Saving Design', desc: 'Growing vertically saves up to 90% of valuable garden real estate compared to traditional ground gardening. Perfect for small raised beds, urban gardens, and patio containers.' },
      { title: 'Easy Tool-Free Assembly', desc: 'Snap-lock connectors mean you can have your trellis fully erected in under 10 minutes — absolutely no tools, screws, or complicated hardware required.' },
      { title: 'Improved Air Circulation', desc: 'Elevated foliage gets better airflow reducing mildew and fungal diseases. Leaves and fruit also dry faster after morning dew or rainfall, promoting healthier plants.' },
      { title: 'Comes with Plant Ties & Clips', desc: 'Includes 20 reusable adjustable plant ties, 10 butterfly clips, and 20 feet of green garden twine to help secure vines as they grow. Perfect for cucumbers, beans, peas, tomatoes, and flowering vines.' }
    ],
    specifications: {
      'Material': 'Galvanized Steel + PE Coating',
      'Dimensions (H x W)': '72" x 48" (6 ft x 4 ft)',
      'Weight': '4.2 lbs',
      'Finish': 'Powder-Coated Rust-Resistant',
      'Assembly Time': '5-10 minutes',
      'Max Load': '25 lbs of climbing plants',
      'Included Accessories': '20 Plant Ties + 10 Butterfly Clips + Twine',
      'Warranty': '1-Year Manufacturer Warranty'
    }
  },
  2: {
    category: 'Health & Wellness',
    features: [
      { title: 'Triple Action Formula', desc: 'Combines Type II Collagen, Hyaluronic Acid, and Glucosamine Chondroitin in one clinically-proven dose. Three pathways of joint support in every convenient tablet.' },
      { title: 'Clinically Studied UC-II Collagen', desc: 'Features undenatured type II collagen backed by 7 human clinical trials. Shown to improve joint comfort, flexibility, and mobility within 7-14 days of consistent use.' },
      { title: '64-Day Value Supply', desc: 'Each bottle contains 64 coated tablets — a full two-month supply at one per day. More cost-effective than competing brands that require 3 pills daily.' },
      { title: 'Easy-to-Swallow Coated Tablets', desc: 'Smooth enteric-coated tablets go down easily without aftertaste. Gentle enough on the stomach to take with or without food, morning or night.' },
      { title: 'Non-GMO & Gluten Free', desc: 'Third-party tested for purity and potency. Made in a GMP-certified facility. No gluten, soy, dairy, artificial colors, or preservatives.' }
    ],
    specifications: {
      'Serving Size': '1 Tablet daily',
      'Servings Per Bottle': '64',
      'Type II Collagen (UC-II)': '40 mg',
      'Hyaluronic Acid': '3.3 mg',
      'Unconditional Guarantee': 'Yes',
      'Form': 'Coated Tablet',
      'Allergen Info': 'Gluten-Free, Non-GMO',
      'Made In': 'USA'
    }
  },
  3: {
    category: 'Bags',
    features: [
      { title: 'Insulated Lunch Compartment & Leakproof', desc: 'The teacher tote bag features a lunch compartment on the side that can keep food warm for up to 4 hours and cold drinks for up to 6 hours. The high-quality insulated layer of the lunch box ensures a completely leak-proof seal — no more worrying about spills in your bag.' },
      { title: 'Fits 15.6 Inch Laptop with Padded Sleeve', desc: 'Dedicated padded laptop compartment with 5mm foam cushioning fits most 15.6" laptops. The thick padding absorbs shock and prevents scratches during your daily commute.' },
      { title: '32L Large Capacity with 18 Pockets', desc: 'Roomy main compartment easily holds a teacher\'s binder stack, grading folders, planner, water bottle, and personal items. Organize with 2 front slip pockets, 2 zippered pockets, 4 pen slots, and a key hook.' },
      { title: 'Premium Quilted Water-Resistant Fabric', desc: 'Crafted from ultra-durable quilted polyester with a water-resistant coating. Spills wipe away instantly and light rain won\'t reach your papers. Reinforced stitching at all stress points ensures long-lasting use.' },
      { title: 'Convertible Carry Options', desc: 'Includes comfortable top tote handles plus a fully adjustable, removable shoulder strap with padded air mesh. Switch between shoulder, crossbody, or hand carry depending on your load.' }
    ],
    specifications: {
      'Color': 'Black',
      'Style Name': 'Utility',
      'Material': 'Quilted Polyester + PEVA Insulation',
      'Capacity': '32 Liters',
      'Laptop Compartment': 'Up to 15.6"',
      'Lunch Compartment': '9" x 9" x 6" (holds 6 cans)',
      'Total Pockets': '18',
      'Strap': 'Adjustable + Detachable Shoulder Strap',
      'Weight': '1.85 lbs',
      'Dimensions': '16.5" L x 6.7" W x 13" H'
    }
  },
  4: {
    category: 'Pet Supplies',
    features: [
      { title: 'Circular ½ Acre Coverage Area', desc: 'The wireless pet fence creates a ½ acre circular containment zone (adjustable down to 1/3 acre) around the transmitter unit. No digging, no buried wires, and no professional installation required.' },
      { title: 'Progressive Tone + Static Correction', desc: 'As your pet approaches the boundary they first hear a warning tone, then experience 5 levels of safe static stimulation that automatically increases if they continue forward. Gentle enough for 5lb dogs, effective for 150lb breeds.' },
      { title: 'Waterproof Rechargeable Receiver Collar', desc: 'The lightweight collar receiver is IPX7 waterproof so your dog can swim, play in the rain, and run through sprinklers without issue. Battery lasts 2-3 weeks on a single 2-hour charge.' },
      { title: 'Portable & Travel-Friendly', desc: 'The compact base unit plugs into any standard outlet and is small enough to pack for RV trips, cabin stays, or family visits. Set up a temporary containment zone wherever you go.' },
      { title: 'Expandable to Unlimited Dogs', desc: 'Works with an unlimited number of PetSafe add-on receiver collars (each sold separately). Perfect for multi-dog households — each dog can be set to their own correction level.' }
    ],
    specifications: {
      'Coverage': 'Up to ½ Acre Circular',
      'Collar Weight': '1.1 oz',
      'Recommended Pet Weight': '5 lbs +',
      'Neck Size': '6"-28"',
      'Correction Levels': 'Tone + 5 Static Levels',
      'Battery Life': '2-3 Weeks per Charge',
      'Waterproof Rating': 'IPX7 (submersible to 3ft)',
      'Expandable': 'Yes (unlimited dogs)',
      'Warranty': '1-Year Limited Warranty'
    }
  },
  5: {
    category: 'Beauty & Personal Care',
    features: [
      { title: 'Instant Root-Lift & Volume', desc: 'A few quick sprays at the roots deliver 24 hours of gravity-defying volume and texture. Fine hair looks 3x thicker immediately, with no visible residue or "helmet hair" stiffness.' },
      { title: 'Lightweight Dry Shampoo Formula', desc: 'Doubles as a second-day hair refresher! Ultra-fine rice starch powders absorb excess oil, sweat, and odor between washes while simultaneously adding body. Brush out cleanly — no white cast on any hair color.' },
      { title: 'Beach-Ready Matte Textured Finish', desc: 'Creates that perfectly imperfect "I woke up like this" piecey texture with a natural matte finish. Great for messy buns, textured bobs, shags, and beach waves without crunchiness.' },
      { title: 'UV + Heat Protection Up to 400°F', desc: 'Built-in heat protectant shields strands from flat iron, curling wand, and blow dryer damage. UV filters help prevent color fade and sun dry-out for salon-quality results at home.' },
      { title: 'Cruelty-Free Vegan Ingredients', desc: 'Certified vegan and cruelty-free by Leaping Bunny. Formulated without sulfates, parabens, phthalates, or synthetic dyes. Infused with provitamin B5 and bamboo extract to nourish hair over time.' }
    ],
    specifications: {
      'Size': '5.6 fl oz (165 ml)',
      'Finish': 'Matte Texturized',
      'Hair Type': 'All Hair Types (Safe for Color-Treated)',
      'Heat Protection': 'Up to 400°F / 205°C',
      'Hold Level': '3/10 Flexible',
      'Cruelty Free': 'Yes (Leaping Bunny Certified)',
      'Vegan': 'Yes',
      'Fragrance': 'Tropical Vanilla Coconut',
      'Shelf Life': '24 Months after opening'
    }
  }
}

export { ASSETS_BASE, buildProduct, editorFeaturesSpecs, createSpecs }
