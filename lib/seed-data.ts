// Seed catalogue. Same function signatures the Postgres data layer will expose,
// so screens do not change when /replica-backend swaps this out.

export type Variant = { group: string; name: string; swatch: string; delta: number };
export type Size = { name: string; delta: number };
export type Review = { author: string; city: string; date: string; stars: number; text: string };

export type Product = {
  slug: string;
  name: string;
  category: string;
  sub: string;
  material: string;
  finish: string;
  colour: string;
  design: string;
  price: number; // rupees, default variant + size
  mrp: number;
  rating: number;
  ratingCount: number;
  shipsFast: boolean;
  deal: boolean;
  images: string[];
  variants: Variant[];
  sizes: Size[];
  dims: string;
  summary: string;
};

export type Category = {
  slug: string;
  name: string;
  room: string;
  blurb: string;
  image: string;
  subs: string[];
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const IMG = {
  greenSofa: u("1555041469-a586c61ea9bc"),
  yellowNook: u("1586023492125-27b2c045efd7"),
  bedroomTufted: u("1505693416388-ac5ce068fe85"),
  diningGreen: u("1617806118233-18e1de247200"),
  lounge: u("1524758631624-e2822e304c36"),
  greySofa: u("1493663284031-b7e3aefcae8e"),
  tanSofa: u("1540574163026-643ea20ade25"),
  whiteChair: u("1567538096630-e0c55bd6374c"),
  yellowArmchair: u("1550226891-ef816aed4a98"),
  blackChair: u("1592078615290-033ee584e267"),
  loft: u("1538688525198-9b88f6f53126"),
  console: u("1532372320572-cda25653a26d"),
  stool: u("1503602642458-232111445657"),
  sectionalRoom: u("1616486338812-3dadae4b4ace"),
  sideboardRoom: u("1618220179428-22790b461013"),
  sunnyLiving: u("1600210492486-724fe5c67fb0"),
  whiteBed: u("1588046130717-0eb0c9a3ba15"),
  greyBed: u("1631049307264-da0ec9d70304"),
  barStool: u("1581539250439-c96689b516dd"),
  wallShelves: u("1594026112284-02bb6f3352fe"),
  desk: u("1518455027359-f3f8164ba6bd"),
  roundTable: u("1533090481720-856c6e3c1fdc"),
  woodDining: u("1577140917170-285929fb55b7"),
  brightBedroom: u("1595526114035-0d45ed16cfbf"),
  platformBed: u("1617325247661-675ab4b64ae2"),
  blueSofa: u("1484101403633-562f891dc89a"),
  sideboard: u("1556020685-ae41abfc9365"),
  diningChair: u("1598300042247-d088f8ab3a91"),
  plantBedroom: u("1615874959474-d609969a20ed"),
  wingChair: u("1634643836960-c345b3c3e998"),
  sideTable: u("1611486212557-88be5ff6f941"),
  tvLiving: u("1600121848594-d8644e57abab"),
  bedside: u("1499933374294-4584851497cc"),
  smallDining: u("1554295405-abb8fd54f153"),
  studyNook: u("1519710164239-da123dc03ef4"),
  rugLiving: u("1617103996702-96ff29b1c467"),
  tealSofa: u("1630585308572-f53438fc684f"),
  mustardChair: u("1616627547584-bf28cee262db"),
};

export const img = (src: string, w = 800) => `${src}?w=${w}&q=75&auto=format&fit=crop`;

export const categories: Category[] = [
  { slug: "sofas", name: "Sofas", room: "Living", blurb: "Deep seats, honest frames and fabrics you can actually live on.", image: IMG.greenSofa, subs: ["3 Seater", "2 Seater", "L-Shape", "Sofa Cum Bed"] },
  { slug: "beds", name: "Beds", room: "Bedroom", blurb: "Solid wood beds with storage that swallows the clutter.", image: IMG.platformBed, subs: ["King", "Queen", "With Storage"] },
  { slug: "dining", name: "Dining Sets", room: "Dining", blurb: "Tables built for long dinners and loud conversations.", image: IMG.woodDining, subs: ["4 Seater", "6 Seater", "Chairs"] },
  { slug: "chairs", name: "Accent Chairs", room: "Living", blurb: "One good chair can change a whole corner.", image: IMG.mustardChair, subs: ["Armchairs", "Wingback", "Stools"] },
  { slug: "tables", name: "Coffee & Side Tables", room: "Living", blurb: "The pieces everything else gathers around.", image: IMG.sideTable, subs: ["Coffee Tables", "Side Tables", "Consoles"] },
  { slug: "storage", name: "Storage & TV Units", room: "Storage", blurb: "Sideboards, TV units and shelves that keep things calm.", image: IMG.sideboard, subs: ["TV Units", "Sideboards", "Shelves"] },
  { slug: "study", name: "Study & Office", room: "Study", blurb: "Desks and chairs for the hours that matter.", image: IMG.desk, subs: ["Desks", "Chairs"] },
];

export const rooms = [
  { name: "Living Room", slug: "sofas", image: IMG.sectionalRoom },
  { name: "Bedroom", slug: "beds", image: IMG.bedroomTufted },
  { name: "Dining Room", slug: "dining", image: IMG.diningGreen },
  { name: "Work From Home", slug: "study", image: IMG.lounge },
];

const fabric = (names: [string, string][], group = "Fabric"): Variant[] =>
  names.map(([name, swatch], i) => ({ group, name, swatch, delta: i === 2 ? 2000 : 0 }));
const wood: Variant[] = [
  { group: "Wood Finish", name: "Natural Teak", swatch: "#a8743f", delta: 0 },
  { group: "Wood Finish", name: "Dark Walnut", swatch: "#5a3a22", delta: 0 },
  { group: "Wood Finish", name: "Honey Oak", swatch: "#c9944e", delta: 1500 },
];
const seats: Size[] = [
  { name: "1 Seater", delta: -26000 },
  { name: "2 Seater", delta: -13000 },
  { name: "3 Seater", delta: 0 },
];
const beds: Size[] = [
  { name: "Queen", delta: 0 },
  { name: "King", delta: 6000 },
];

type Seed = Omit<Product, "rating" | "ratingCount" | "deal" | "shipsFast" | "summary"> &
  Partial<Pick<Product, "rating" | "ratingCount" | "deal" | "shipsFast" | "summary">>;

const seeds: Seed[] = [
  // Sofas
  { slug: "nila-3-seater-velvet-sofa", name: "Nila 3 Seater Velvet Sofa", category: "sofas", sub: "3 Seater", material: "Velvet", finish: "Natural Teak", colour: "Green", design: "Mid-Century", price: 46990, mrp: 82000, images: [IMG.greenSofa, IMG.tealSofa, IMG.rugLiving], variants: fabric([["Forest Green", "#1f4d3a"], ["Ink Blue", "#23365c"], ["Rust", "#9a4a2a"]], "Velvet"), sizes: seats, dims: "78 L x 34 W x 32 H in", deal: true, shipsFast: true },
  { slug: "kesar-leather-look-sofa", name: "Kesar 3 Seater Leatherette Sofa", category: "sofas", sub: "3 Seater", material: "Leatherette", finish: "Dark Walnut", colour: "Brown", design: "Modern", price: 54990, mrp: 96000, images: [IMG.tanSofa, IMG.sunnyLiving], variants: fabric([["Cognac", "#9b5a2e"], ["Espresso", "#3d2a1f"], ["Stone", "#b6ab9c"]], "Leatherette"), sizes: seats, dims: "84 L x 36 W x 31 H in" },
  { slug: "megh-tufted-sofa", name: "Megh Tufted 3 Seater Sofa", category: "sofas", sub: "3 Seater", material: "Cotton", finish: "Natural Teak", colour: "Grey", design: "Chesterfield", price: 39990, mrp: 71000, images: [IMG.greySofa, IMG.tvLiving], variants: fabric([["Cloud Grey", "#9a9a98"], ["Oat", "#d8cbb4"], ["Charcoal", "#3b3b3b"]], "Cotton"), sizes: seats, dims: "80 L x 33 W x 31 H in", shipsFast: true },
  { slug: "sagar-2-seater-sofa", name: "Sagar 2 Seater Fabric Sofa", category: "sofas", sub: "2 Seater", material: "Cotton", finish: "Dark Walnut", colour: "Blue", design: "Contemporary", price: 27990, mrp: 48000, images: [IMG.blueSofa, IMG.greySofa], variants: fabric([["Powder Blue", "#a9b9cf"], ["Sand", "#cdb991"], ["Olive", "#6b6b3a"]], "Cotton"), sizes: [{ name: "2 Seater", delta: 0 }, { name: "3 Seater", delta: 9000 }], dims: "62 L x 32 W x 33 H in", deal: true },
  { slug: "vistar-l-shape-sectional", name: "Vistar L-Shape Sectional Sofa", category: "sofas", sub: "L-Shape", material: "Cotton", finish: "Natural Teak", colour: "Cream", design: "Modern", price: 79990, mrp: 139000, images: [IMG.sectionalRoom, IMG.sunnyLiving, IMG.rugLiving], variants: fabric([["Ivory", "#ece5d6"], ["Sage", "#9aa88a"], ["Taupe", "#8b7d6b"]], "Cotton"), sizes: [{ name: "Left Aligned", delta: 0 }, { name: "Right Aligned", delta: 0 }], dims: "112 L x 64 W x 32 H in", shipsFast: true },
  { slug: "jharna-teal-sofa-cum-bed", name: "Jharna Sofa Cum Bed with Storage", category: "sofas", sub: "Sofa Cum Bed", material: "Velvet", finish: "Dark Walnut", colour: "Green", design: "Modern", price: 41990, mrp: 77000, images: [IMG.tealSofa, IMG.greenSofa], variants: fabric([["Teal", "#1b5f63"], ["Mustard", "#c39a2b"], ["Plum", "#5d2f48"]], "Velvet"), sizes: [{ name: "Queen", delta: 0 }, { name: "King", delta: 5000 }], dims: "76 L x 38 W x 33 H in" },

  // Beds
  { slug: "aranya-platform-bed", name: "Aranya Solid Wood Platform Bed", category: "beds", sub: "King", material: "Sheesham Wood", finish: "Natural Teak", colour: "Brown", design: "Minimal", price: 32990, mrp: 59000, images: [IMG.platformBed, IMG.plantBedroom], variants: wood, sizes: beds, dims: "84 L x 78 W x 14 H in", deal: true, shipsFast: true },
  { slug: "rani-upholstered-bed", name: "Rani Upholstered Bed with Hydraulic Storage", category: "beds", sub: "With Storage", material: "Engineered Wood", finish: "Dark Walnut", colour: "Cream", design: "Classic", price: 58990, mrp: 112000, images: [IMG.bedroomTufted, IMG.whiteBed], variants: fabric([["Ivory", "#ece5d6"], ["Dove", "#bdb6ac"], ["Blush", "#d8b2a6"]], "Headboard"), sizes: beds, dims: "86 L x 80 W x 48 H in" },
  { slug: "shanti-panel-bed", name: "Shanti Panel Headboard Bed", category: "beds", sub: "Queen", material: "Engineered Wood", finish: "Dark Walnut", colour: "Grey", design: "Contemporary", price: 24990, mrp: 44000, images: [IMG.greyBed, IMG.brightBedroom], variants: fabric([["Slate", "#5d6266"], ["Sand", "#cdb991"], ["Navy", "#26324f"]], "Headboard"), sizes: beds, dims: "84 L x 66 W x 44 H in", shipsFast: true },
  { slug: "chandni-storage-bed", name: "Chandni Box Storage Bed", category: "beds", sub: "With Storage", material: "Sheesham Wood", finish: "Honey Oak", colour: "White", design: "Classic", price: 36990, mrp: 64000, images: [IMG.whiteBed, IMG.bedside], variants: wood, sizes: beds, dims: "84 L x 78 W x 40 H in" },
  { slug: "pallav-bed-with-drawers", name: "Pallav Bed with Side Drawers", category: "beds", sub: "King", material: "Mango Wood", finish: "Natural Teak", colour: "Brown", design: "Rustic", price: 44990, mrp: 79000, images: [IMG.plantBedroom, IMG.brightBedroom], variants: wood, sizes: beds, dims: "86 L x 80 W x 42 H in", deal: true },

  // Dining
  { slug: "utsav-6-seater-dining-set", name: "Utsav 6 Seater Dining Set", category: "dining", sub: "6 Seater", material: "Sheesham Wood", finish: "Natural Teak", colour: "Brown", design: "Modern", price: 52990, mrp: 104000, images: [IMG.woodDining, IMG.diningGreen], variants: wood, sizes: [{ name: "4 Seater", delta: -14000 }, { name: "6 Seater", delta: 0 }], dims: "72 L x 36 W x 30 H in", deal: true, shipsFast: true },
  { slug: "hara-velvet-dining-set", name: "Hara 6 Seater Dining Set with Velvet Chairs", category: "dining", sub: "6 Seater", material: "Velvet", finish: "Honey Oak", colour: "Green", design: "Contemporary", price: 74990, mrp: 129000, images: [IMG.diningGreen, IMG.woodDining], variants: fabric([["Emerald", "#1f5a43"], ["Blush", "#d8b2a6"], ["Grey", "#8d8d8b"]], "Chair Fabric"), sizes: [{ name: "6 Seater", delta: 0 }], dims: "72 L x 38 W x 30 H in" },
  { slug: "gol-round-dining-table", name: "Gol Round 4 Seater Dining Set", category: "dining", sub: "4 Seater", material: "Ash Wood", finish: "Honey Oak", colour: "White", design: "Scandinavian", price: 29990, mrp: 52000, images: [IMG.roundTable, IMG.smallDining], variants: wood, sizes: [{ name: "4 Seater", delta: 0 }], dims: "42 dia x 30 H in", shipsFast: true },
  { slug: "nook-2-seater-cafe-set", name: "Nook 2 Seater Cafe Dining Set", category: "dining", sub: "4 Seater", material: "Engineered Wood", finish: "Dark Walnut", colour: "Black", design: "Minimal", price: 13990, mrp: 24000, images: [IMG.smallDining, IMG.roundTable], variants: wood, sizes: [{ name: "2 Seater", delta: 0 }], dims: "30 L x 30 W x 30 H in" },
  { slug: "sona-dining-chair", name: "Sona Upholstered Dining Chair (Set of 2)", category: "dining", sub: "Chairs", material: "Ash Wood", finish: "Honey Oak", colour: "Grey", design: "Scandinavian", price: 15990, mrp: 27000, images: [IMG.diningChair, IMG.whiteChair], variants: fabric([["Ash Grey", "#9d9d9b"], ["Ivory", "#ece5d6"], ["Teal", "#1b5f63"]], "Fabric"), sizes: [{ name: "Set of 2", delta: 0 }, { name: "Set of 4", delta: 14000 }], dims: "19 L x 21 W x 35 H in" },

  // Chairs
  { slug: "haldi-tufted-accent-chair", name: "Haldi Tufted Accent Chair", category: "chairs", sub: "Armchairs", material: "Velvet", finish: "Dark Walnut", colour: "Yellow", design: "Classic", price: 18990, mrp: 33000, images: [IMG.mustardChair, IMG.yellowNook], variants: fabric([["Mustard", "#c39a2b"], ["Emerald", "#1f5a43"], ["Plum", "#5d2f48"]], "Velvet"), sizes: [{ name: "Standard", delta: 0 }], dims: "28 L x 30 W x 34 H in", deal: true, shipsFast: true },
  { slug: "pankh-wingback-chair", name: "Pankh Wingback Lounge Chair", category: "chairs", sub: "Wingback", material: "Cotton", finish: "Natural Teak", colour: "Grey", design: "Contemporary", price: 21990, mrp: 38000, images: [IMG.wingChair, IMG.yellowArmchair], variants: fabric([["Slate", "#5d6266"], ["Oat", "#d8cbb4"], ["Rust", "#9a4a2a"]], "Cotton"), sizes: [{ name: "Standard", delta: 0 }], dims: "30 L x 32 W x 40 H in" },
  { slug: "dhoop-armchair-and-ottoman", name: "Dhoop Armchair with Ottoman", category: "chairs", sub: "Armchairs", material: "Cotton", finish: "Honey Oak", colour: "Yellow", design: "Mid-Century", price: 24990, mrp: 42000, images: [IMG.yellowArmchair, IMG.yellowNook], variants: fabric([["Marigold", "#d39a2a"], ["Sage", "#9aa88a"], ["Ivory", "#ece5d6"]], "Cotton"), sizes: [{ name: "Chair Only", delta: -6000 }, { name: "With Ottoman", delta: 0 }], dims: "29 L x 31 W x 36 H in" },
  { slug: "kala-shell-chair", name: "Kala Moulded Shell Chair", category: "chairs", sub: "Stools", material: "Ash Wood", finish: "Natural Teak", colour: "Black", design: "Scandinavian", price: 5990, mrp: 9900, images: [IMG.blackChair, IMG.barStool], variants: [{ group: "Shell", name: "Black", swatch: "#1d1d1d", delta: 0 }, { group: "Shell", name: "White", swatch: "#f2f2f0", delta: 0 }], sizes: [{ name: "Dining Height", delta: 0 }, { name: "Bar Height", delta: 1500 }], dims: "18 L x 20 W x 32 H in", shipsFast: true },
  { slug: "safed-boudoir-chair", name: "Safed Boudoir Chair", category: "chairs", sub: "Armchairs", material: "Velvet", finish: "Honey Oak", colour: "White", design: "Classic", price: 12990, mrp: 21000, images: [IMG.whiteChair, IMG.diningChair], variants: fabric([["Pearl", "#f1ece2"], ["Blush", "#d8b2a6"], ["Grey", "#8d8d8b"]], "Velvet"), sizes: [{ name: "Standard", delta: 0 }], dims: "24 L x 24 W x 32 H in" },

  // Tables
  { slug: "dharti-coffee-table", name: "Dharti Round Coffee Table", category: "tables", sub: "Coffee Tables", material: "Mango Wood", finish: "Natural Teak", colour: "Brown", design: "Rustic", price: 14990, mrp: 27000, images: [IMG.rugLiving, IMG.tealSofa], variants: wood, sizes: [{ name: "Standard", delta: 0 }], dims: "36 dia x 16 H in", deal: true },
  { slug: "pothi-side-table", name: "Pothi C-Shaped Side Table", category: "tables", sub: "Side Tables", material: "Sheesham Wood", finish: "Honey Oak", colour: "Brown", design: "Mid-Century", price: 6990, mrp: 11900, images: [IMG.sideTable, IMG.bedside], variants: wood, sizes: [{ name: "Standard", delta: 0 }], dims: "16 L x 14 W x 22 H in", shipsFast: true },
  { slug: "darpan-console-table", name: "Darpan Console Table with Shelf", category: "tables", sub: "Consoles", material: "Mango Wood", finish: "Natural Teak", colour: "Brown", design: "Rustic", price: 17990, mrp: 31000, images: [IMG.console, IMG.sideboardRoom], variants: wood, sizes: [{ name: "Standard", delta: 0 }], dims: "44 L x 14 W x 30 H in" },
  { slug: "chhota-bedside-table", name: "Chhota Bedside Table", category: "tables", sub: "Side Tables", material: "Ash Wood", finish: "Honey Oak", colour: "White", design: "Scandinavian", price: 4990, mrp: 8500, images: [IMG.bedside, IMG.sideTable], variants: wood, sizes: [{ name: "Single", delta: 0 }, { name: "Pair", delta: 4500 }], dims: "18 dia x 22 H in" },

  // Storage
  { slug: "kosh-sideboard", name: "Kosh Sideboard with Sliding Doors", category: "storage", sub: "Sideboards", material: "Engineered Wood", finish: "Honey Oak", colour: "White", design: "Scandinavian", price: 27990, mrp: 49000, images: [IMG.sideboard, IMG.sideboardRoom], variants: wood, sizes: [{ name: "Standard", delta: 0 }], dims: "60 L x 16 W x 30 H in", shipsFast: true },
  { slug: "rang-tv-unit", name: "Rang Low TV Unit", category: "storage", sub: "TV Units", material: "Sheesham Wood", finish: "Dark Walnut", colour: "Brown", design: "Modern", price: 23990, mrp: 44000, images: [IMG.tvLiving, IMG.wallShelves], variants: wood, sizes: [{ name: "Up to 55 in", delta: 0 }, { name: "Up to 65 in", delta: 4000 }], dims: "72 L x 16 W x 20 H in", deal: true },
  { slug: "tara-floating-wall-shelves", name: "Tara Floating Wall Shelves (Set of 5)", category: "storage", sub: "Shelves", material: "Engineered Wood", finish: "Honey Oak", colour: "White", design: "Minimal", price: 8990, mrp: 15900, images: [IMG.wallShelves, IMG.console], variants: wood, sizes: [{ name: "Set of 5", delta: 0 }], dims: "Mixed sizes" },
  { slug: "sanduk-mustard-cabinet", name: "Sanduk Fluted Cabinet", category: "storage", sub: "Sideboards", material: "Mango Wood", finish: "Honey Oak", colour: "Yellow", design: "Contemporary", price: 31990, mrp: 55000, images: [IMG.sideboardRoom, IMG.sideboard], variants: wood, sizes: [{ name: "Standard", delta: 0 }], dims: "54 L x 16 W x 32 H in" },

  // Study
  { slug: "lekh-study-desk", name: "Lekh Trestle Study Desk", category: "study", sub: "Desks", material: "Engineered Wood", finish: "Honey Oak", colour: "White", design: "Minimal", price: 12990, mrp: 22900, images: [IMG.desk, IMG.studyNook], variants: wood, sizes: [{ name: "48 in", delta: 0 }, { name: "60 in", delta: 2500 }], dims: "48 L x 24 W x 30 H in", shipsFast: true, deal: true },
  { slug: "dhyan-writing-table", name: "Dhyan Writing Table", category: "study", sub: "Desks", material: "Ash Wood", finish: "Natural Teak", colour: "White", design: "Scandinavian", price: 15990, mrp: 26900, images: [IMG.studyNook, IMG.desk], variants: wood, sizes: [{ name: "Standard", delta: 0 }], dims: "42 L x 22 W x 30 H in" },
  { slug: "kaksha-lounge-chair", name: "Kaksha Work Lounge Chair", category: "study", sub: "Chairs", material: "Cotton", finish: "Natural Teak", colour: "Grey", design: "Contemporary", price: 16990, mrp: 29000, images: [IMG.lounge, IMG.loft], variants: fabric([["Stone", "#b6ab9c"], ["Black", "#222222"], ["Teal", "#1b5f63"]], "Fabric"), sizes: [{ name: "Standard", delta: 0 }], dims: "26 L x 27 W x 32 H in" },
];

// Deterministic pseudo-ratings so the server and client render the same numbers.
function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export const products: Product[] = seeds.map((s) => {
  const h = hash(s.slug);
  return {
    rating: Math.round((4.1 + (h % 9) / 10) * 10) / 10,
    ratingCount: 20 + (h % 900),
    deal: false,
    shipsFast: false,
    summary: `The ${s.name.split(" ")[0]} is made in our own workshop from ${s.material.toLowerCase()}, finished by hand and checked twice before it leaves. ${s.design} lines, sturdy joinery and a finish that wears in, not out.`,
    ...s,
  };
});

export const reviewsFor = (slug: string): Review[] => {
  const pool: Review[] = [
    { author: "Ananya R.", city: "Pune", date: "12 Oct 2026", stars: 5, text: "Arrived a day early and the assembly team was in and out in forty minutes. The finish looks richer in person." },
    { author: "Karthik S.", city: "Chennai", date: "28 Sep 2026", stars: 5, text: "Solid, no wobble, and the fabric has already survived a toddler and a juice box." },
    { author: "Meher P.", city: "Delhi", date: "3 Sep 2026", stars: 4, text: "Colour is a shade darker than the photos, but honestly I like it more. Very comfortable." },
    { author: "Irfan K.", city: "Hyderabad", date: "19 Aug 2026", stars: 5, text: "Third piece I've bought here. Consistent quality and the packaging was excellent." },
    { author: "Divya M.", city: "Bengaluru", date: "2 Aug 2026", stars: 4, text: "Took a week longer than promised, but support kept me updated and the product is great." },
  ];
  const h = hash(slug);
  return [...pool.slice(h % 3), ...pool.slice(0, h % 3)].slice(0, 4);
};

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const productsIn = (category: string) => products.filter((p) => p.category === category);
export const similarTo = (p: Product) =>
  products.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
export const bestSellers = (category?: string) =>
  products.filter((p) => !category || p.category === category).sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 8);

export function search(q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return products.filter((p) => {
    const hay = `${p.name} ${p.category} ${p.sub} ${p.material} ${p.finish} ${p.colour} ${p.design} ${p.variants.map((v) => v.name).join(" ")}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export const discount = (price: number, mrp: number) => Math.round((1 - price / mrp) * 100);

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (n: number) => inr.format(n);
