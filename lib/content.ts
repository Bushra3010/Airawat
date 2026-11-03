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

export const rooms = [
  { name: "Living Room", slug: "sofas", image: IMG.sectionalRoom },
  { name: "Bedroom", slug: "beds", image: IMG.bedroomTufted },
  { name: "Dining Room", slug: "dining", image: IMG.diningGreen },
  { name: "Work From Home", slug: "study", image: IMG.lounge },
];
