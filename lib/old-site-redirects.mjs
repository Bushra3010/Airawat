// Permanent redirects from the old WordPress/WooCommerce site (airawathandicraft.com before Nov 2026)
// so old Google results and bookmarks land on the matching new page instead of "not found".
// Product and category addresses are matched by keyword (first rule wins), so pages the
// Internet Archive never saw are covered too. Single old pages are listed in old-site-pages.json.
import oldPages from "./old-site-pages.json" with { type: "json" };

const byKeyword = [
  ["(?:bedside|night-?stand)", "/c/tables"],
  ["(?:study|office|desk|writing|laptop|computer|work-from-home)", "/c/study"],
  ["(?:sofa|couch|diwan|divan)", "/c/sofas"],
  ["(?:dining|dinning)", "/c/dining"],
  ["(?:wardrobe|almira|cupboard|cabinet|sideboard|showcase|shel[fv]|book|tv|rack|chest|hutch|treasure|box|drawer|storage|dresser|crockery|bar-unit|trunk)", "/c/storage"],
  ["(?:bed|head-?board)", "/c/beds"],
  ["(?:chair|rocking|swing|lounge|recliner)", "/c/chairs"],
  ["(?:table|stool|console|teapoy|cent(?:er|re)|corner)", "/c/tables"],
  ["(?:living-room)", "/c/sofas"],
];

export function oldSiteRedirects() {
  const rules = [];
  for (const prefix of ["product", "product-category"]) {
    for (const [kw, to] of byKeyword) {
      rules.push({ source: `/${prefix}/:path(.*${kw}.*)`, destination: to, permanent: true });
    }
    rules.push({ source: `/${prefix}/:path*`, destination: "/", permanent: true });
    rules.push({ source: `/${prefix}`, destination: "/", permanent: true });
  }
  for (const old of ["shop", "blog", "tag", "category", "author", "fusion_tb_category", "2019", "2020", "2021", "2022", "2023", "2024", "2025"]) {
    rules.push({ source: `/${old}/:path*`, destination: "/", permanent: true });
    rules.push({ source: `/${old}`, destination: "/", permanent: true });
  }
  for (const [slug, to] of Object.entries(oldPages)) {
    rules.push({ source: `/${slug}`, destination: to, permanent: true });
  }
  return rules;
}
