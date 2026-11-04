// Marketing imagery used by the home page (not catalogue data).
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const IMG = {
  diningGreen: u("1617806118233-18e1de247200"),
  tealSofa: u("1630585308572-f53438fc684f"),
  bedroomTufted: u("1505693416388-ac5ce068fe85"),
  sectionalRoom: u("1616486338812-3dadae4b4ace"),
  lounge: u("1524758631624-e2822e304c36"),
  woodDining: u("1577140917170-285929fb55b7"),
  whiteBed: u("1588046130717-0eb0c9a3ba15"),
  sunnyLiving: u("1600210492486-724fe5c67fb0"),
};

/**
 * What goes in each room. An item links to `href` when the shop has matching products
 * (same category/sub, or a keyword in the product's name/type/material); otherwise it
 * becomes a WhatsApp enquiry, and switches to a link once such products are added.
 */
export type RoomItem = { label: string; href?: string; cat?: string; sub?: string; keywords: string[] };
export type Room = { name: string; slug: string; image: string; items: RoomItem[] };

export const rooms: Room[] = [
  {
    name: "Living Room", slug: "sofas", image: IMG.sectionalRoom,
    items: [
      { label: "Sofa", href: "/c/sofas", cat: "sofas", keywords: ["sofa"] },
      { label: "Centre table", href: "/c/tables?sub=Coffee+Tables", cat: "tables", sub: "Coffee Tables", keywords: ["coffee table", "centre table", "center table"] },
      { label: "TV unit", href: "/c/storage?sub=TV+Units", cat: "storage", sub: "TV Units", keywords: ["tv unit"] },
      { label: "Lamps", keywords: ["lamp"] },
      { label: "Sideboard", href: "/c/storage?sub=Sideboards", cat: "storage", sub: "Sideboards", keywords: ["sideboard"] },
      { label: "Console table", href: "/c/tables?sub=Consoles", cat: "tables", sub: "Consoles", keywords: ["console"] },
      { label: "Flower pot", keywords: ["flower pot", "planter", "vase"] },
    ],
  },
  {
    name: "Bedroom", slug: "beds", image: IMG.bedroomTufted,
    items: [
      { label: "Bed", href: "/c/beds", cat: "beds", keywords: [] },
      { label: "Bedside table", href: "/c/tables?sub=Side+Tables", cat: "tables", sub: "Side Tables", keywords: ["bedside"] },
      { label: "Wardrobe", keywords: ["wardrobe", "almirah"] },
      { label: "Lamps", keywords: ["lamp"] },
    ],
  },
  {
    name: "Dining Room", slug: "dining", image: IMG.diningGreen,
    items: [
      { label: "Dining table", href: "/c/dining", cat: "dining", keywords: ["dining set", "dining table"] },
      { label: "Foldable dining table", keywords: ["foldable", "folding"] },
      { label: "Chairs", href: "/c/dining?sub=Chairs", cat: "dining", sub: "Chairs", keywords: ["dining chair"] },
      { label: "Wooden utensils", keywords: ["coaster", "plate", "spoon", "bowl", "utensil", "tray"] },
    ],
  },
  {
    name: "Work From Home", slug: "study", image: IMG.lounge,
    items: [
      { label: "Computer table", href: "/c/study?sub=Desks", cat: "study", sub: "Desks", keywords: ["computer table", "desk"] },
      { label: "Chair", href: "/c/study?sub=Chairs", cat: "study", sub: "Chairs", keywords: ["office chair", "study chair"] },
    ],
  },
];
