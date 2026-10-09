// One page per shop product, and the Google Merchant Center feed built from the same facts, so the
// page a shopper lands on from Google always matches the listing that sent them.

export type ShopColour = { name: string; hex: string; image?: string | null; back?: string | null };
export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency?: string;
  image: string;
  back?: string | null;
  sizes?: string[];
  colors?: ShopColour[];
  provider?: string;
};

export const SITE = 'https://lovefarfox.com';

/** The shop's sections, in display order; a product sits in the first whose test matches its name. */
export const SHOP_CATEGORIES: { title: string; test: (name: string) => boolean }[] = [
  { title: 'Jerseys', test: (n) => /jersey/i.test(n) },
  { title: 'Tees, Sweats & Flannels', test: (n) => /tee|hoodie|crewneck|flannel/i.test(n) },
  { title: 'Mugs', test: (n) => /mug/i.test(n) },
  { title: 'Ornaments', test: (n) => /ornament/i.test(n) },
  { title: 'Art Prints', test: (n) => /print/i.test(n) },
  { title: 'Stickers', test: (n) => /sticker/i.test(n) },
];
export const shopCategoryOf = (name: string) => SHOP_CATEGORIES.find((c) => c.test(name))?.title ?? 'More';

// From the name, not the store slug, so accents fold (Séparés → separes) instead of splitting the word.
const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const productPath = (p: Pick<ShopProduct, 'name'>) => `/shop/${slugify(p.name)}/`;
export const productUrl = (p: Pick<ShopProduct, 'name'>) => `${SITE}${productPath(p)}`;

type Kind = {
  label: string;
  /** Merchant Center product_type: our own taxonomy, shown in Google's reports. */
  productType: string;
  apparel: boolean;
  facts: string[];
};

// Fabric and build facts come from the print provider's catalogue entry for each blank.
const KINDS: Record<string, Kind> = {
  fcJersey: {
    label: 'Soccer jersey', productType: 'Apparel > Jerseys > Soccer Jerseys', apparel: true,
    facts: ['100% recycled polyester, two-way stretch', 'Moisture-wicking, UPF 50+', 'Double-layered V-neck collar, regular fit', 'Printed edge to edge, so the design never cracks or peels'],
  },
  baseball: {
    label: 'Baseball jersey', productType: 'Apparel > Jerseys > Baseball Jerseys', apparel: true,
    facts: ['100% recycled polyester, 8.1 oz/yd²', 'Moisture-wicking, UPF 50+', 'Button front, drop tail, regular fit', 'OEKO-TEX Standard 100 fabric'],
  },
  tee: {
    label: 'T-shirt', productType: 'Apparel > Tops > T-Shirts', apparel: true,
    facts: ['Bella + Canvas 3001, soft combed ring-spun cotton', 'Lightweight 4.2 oz/yd², pre-shrunk', 'Unisex retail fit, side-seamed'],
  },
  pocketTee: {
    label: 'Pocket T-shirt', productType: 'Apparel > Tops > T-Shirts', apparel: true,
    facts: ['Comfort Colors 6030, 100% ring-spun cotton', 'Heavyweight 6.1 oz/yd², garment-dyed for a broken-in feel', 'Relaxed fit with a real left-chest pocket'],
  },
  hoodie: {
    label: 'Hoodie', productType: 'Apparel > Tops > Hoodies', apparel: true,
    facts: ['Bella + Canvas 3719 fleece, cotton and polyester', '8 oz/yd², regular fit', 'Front pouch pocket'],
  },
  crewneck: {
    label: 'Embroidered crewneck sweatshirt', productType: 'Apparel > Tops > Sweatshirts', apparel: true,
    facts: ['Lane Seven LS14004 premium fleece, 100% cotton face', 'Heavyweight 8.25 oz/yd², regular fit', 'Embroidered, not printed', 'Size up for a looser fit'],
  },
  flannel: {
    label: 'Flannel shirt', productType: 'Apparel > Tops > Flannel Shirts', apparel: true,
    facts: ['Independent Trading Co. EXP50F cotton flannel', 'Button front with chest pockets', 'Printed by DTF for a soft, flexible finish'],
  },
  mug: {
    label: 'Mug', productType: 'Home > Drinkware > Mugs', apparel: false,
    facts: ['Glossy white ceramic', 'Printed on both sides', 'Dishwasher and microwave safe', '11 oz, 15 oz or 20 oz'],
  },
  print: {
    label: 'Art print', productType: 'Home > Decor > Art Prints', apparel: false,
    facts: ['A3, 11.7 × 16.5 in (29.7 × 42 cm), unframed', 'Museum-quality matte paper, 189 g/m²', 'Fits a standard A3 frame'],
  },
  stickerSheet: {
    label: 'Sticker sheet', productType: 'Stationery > Stickers > Sticker Sheets', apparel: false,
    facts: ['A5 sheet, 5.8 × 8.3 in', 'Glossy kiss-cut stickers with a white border', 'For laptops, notebooks and phone cases'],
  },
  ornament: {
    label: 'Christmas ornament', productType: 'Home > Decor > Christmas Ornaments', apparel: false,
    facts: ['Glossy ceramic heart, about 2.9 × 2.7 in', 'The same design printed on both sides', 'Gold-coloured string for hanging', 'Add your two cities, or keep the stock Miles Apart, Close at Heart'],
  },
  sticker: {
    label: 'Sticker', productType: 'Stationery > Stickers > Die-Cut Stickers', apparel: false,
    facts: ['2 × 2 in die-cut vinyl', 'Water and weather resistant', 'For water bottles, laptops and luggage'],
  },
};

export function kindOf(p: Pick<ShopProduct, 'name'>): Kind {
  const n = p.name;
  if (/ornament/i.test(n)) return KINDS.ornament;
  if (/baseball/i.test(n)) return KINDS.baseball;
  if (/jersey/i.test(n)) return KINDS.fcJersey;
  if (/pocket tee/i.test(n)) return KINDS.pocketTee;
  if (/tee/i.test(n)) return KINDS.tee;
  if (/hoodie/i.test(n)) return KINDS.hoodie;
  if (/crewneck/i.test(n)) return KINDS.crewneck;
  if (/flannel/i.test(n)) return KINDS.flannel;
  if (/mug/i.test(n)) return KINDS.mug;
  if (/art print/i.test(n)) return KINDS.print;
  if (/sticker sheet/i.test(n)) return KINDS.stickerSheet;
  if (/sticker/i.test(n)) return KINDS.sticker;
  throw new Error(`No product kind for "${n}"`);
}

const FC_BACK = 'The back reads 143 (pager code for I love you) over FAR FOX FC, or put their name and number on it: the preview updates as you type.';

/** What is on each product, in a few sentences, keyed by provider product id. */
export const PRODUCT_COPY: Record<string, string> = {
  '6ac56a091644af57a506ee5b': 'A plaid flannel with a vintage national-park badge across the back, Foxy at its centre, like a park founded for two people who live far apart. A small Foxy patch sits on the chest pocket. Made for cold-weather calls and the airport pickup.',
  '478884090': 'Foxy on the front with "miss you too", and a pink heart on the back signed "from right here". It is one half of a pair: the Miss You mug says "from far away", so you each drink from your own side of the distance.',
  '478884086': 'Foxy on the front with "miss you", and a pink heart on the back signed "from far away". Send it to them and keep the Miss You Too mug, which answers "from right here".',
  '478854341': 'A classic button-up baseball jersey with "Far Fox" in script across the chest and 143 (I love you, in pager code) on the back. Comes in cream pinstripe, plum or Fox pink, and you can swap the back for their name and number.',
  '478761994': 'Foxy, booked. The back is a black-and-white mugshot of Foxy with pink heart cheeks, holding a placard that reads 143-0214, STOLE YOUR HEART. A FAR FOX P.D. badge sits on the real chest pocket. For the one who took yours and never gave it back.',
  '478740784': 'The Long Distance Club crest, embroidered in thread on the centre chest of a heavyweight crewneck, with a small stitched detail at the wrist. Quiet enough to wear every day, and only the two of you need to know what the club is.',
  '477663642': 'A kit about leaving and writing back.',
  '475849115': 'Deep purple body, pink buffalo-check sleeves and an antlered Foxy crest: the cabin-weekend kit, for couples counting down to the trip where you finally share a fireplace.',
  '475844805': 'Navy and white hoops drawn in Morse code dots and dashes, with pink trim. The original long-distance message, worn as stripes.',
  '475844798': 'Half purple, half Fox pink, stitched together down the middle with a seam of tiny hearts. Other Half B is the mirror image of Other Half A: you each wear one, and stood side by side the two shirts make one kit.',
  '475844794': 'Half Fox pink, half purple, stitched together down the middle with a seam of tiny hearts. Other Half A is the mirror image of Other Half B: you each wear one, and stood side by side the two shirts make one kit.',
  '443631285': 'Golden geese flying in formation across a purple kit. Geese pair for life and still cover thousands of miles a year, which makes them the long-distance team mascot.',
  '443578239': 'White with black Dalmatian spots, and one of the spots is a pink heart. For the couple whose first date was a dog park, or whose dog is the one on the video call.',
  '443540637': 'A teal-to-sunset gradient covered in monstera leaves and hibiscus. The holiday kit, for the trip you are planning to the same beach at the same time.',
  '443420345': 'A rainbow drop trail cuts across a deep purple kit, battle-royale style. For couples whose date night is a duo queue from two different time zones.',
  '443266866': 'A midnight-navy kit with constellation lines picked out in stars, because wherever you each are, you are under the same ones.',
  '443213452': 'A cream kit with a dotted flight path that ends in a heart, and airmail stripes on the sleeves and hem. For the next flight home.',
  '443164966': 'A purple-to-sunset gradient fading into mountains, with the first stars coming out. Twilight is the hour when it is evening for one of you and the day is just starting for the other.',
  '436909622': 'Morse code for "I love you" runs down the chest, with each letter spelled out beside its dots and dashes, and a small Far Fox mark underneath. Only the people who know will read it.',
  '436909615': 'A small Long Distance Club fox crest on the front, and the full club badge across the back: LONG DISTANCE CLUB, est. wherever you are.',
  '436908862': 'Two clocks, one marked here and one marked there, joined by a heart, over "same love, different time zones". For every couple who keeps two clocks on their phone.',
  '436908860': 'A boarding pass on a mug: Far Fox Airways, from HERE to YOU, seat 2-GETHER, departs soon. The back is a second pass for two foxes, passengers: you + me.',
  '436908856': 'A heart drawn in the stars over a purple night sky, with a crescent moon and Foxy watching from below. Under the Same Sky is for the wall you each look at before bed.',
  '436908844': 'An airmail envelope print: Foxy holding a heart inside a red-and-blue Par Avion border, addressed "to: you, wherever you are". A love letter you can frame.',
  '436891457': 'Foxy between two rainbow stripes with LOVE IS LOVE on the front, and Foxy holding a Pride heart with PROUD OF US on the back.',
  '436891456': 'Eight Pride Foxy stickers on one sheet: rainbow hearts, a Love is Love badge, a 143 heart and Foxy waving a flag.',
  '436891455': 'LOVE / IS / LOVE, with IS set on a rainbow band and a small Far Fox heart below. Simple, loud and true.',
  '436888903': 'Eight Foxy stickers on one sheet: Foxy waving, sleeping and sending love, a "miss you", a 143 heart, a little plane and the Far Fox badge.',
  '436888902': 'Foxy with heart eyes on the front and "only for you" on the back. For the person you still go a bit heart-eyed over on every call.',
  '436888901': 'Foxy under a crescent moon on a starry night wrap: "same moon," on one side and "same us." on the other.',
  '436883196': 'Two Foxes side by side under a big pink moon, over "same moon, same us." in script. A soft print for a bedroom wall, in each of your homes.',
  '436883191': 'A Foxy head sticker, die-cut to shape. Small enough for a phone case, tough enough for a water bottle.',
  '436883186': 'Foxy with "miss you too" underneath. Half of a pair with the Miss You sticker: send one, keep one.',
  '436883173': 'Foxy with "miss you" underneath. Half of a pair with the Miss You Too sticker: send one, keep one.',
  '436883154': 'A small Foxy on the chest, and an airmail envelope across the back over WORTH EVERY MILE. The hoodie to steal on a visit, and to send home smelling like you.',
  '479940069': 'A black kit with one bone-white web spun out from an orange fox crest, and a little spider dropping in from the collar with a pink heart on its back. Orange cuffs, and an orange 143 on the back. For the Halloween you spend apart, or the one you finally spend together.',
  '479940099': 'Cream at the chest, orange through the middle and sunny yellow at the hem, in soft chevrons that follow the V-neck, like a piece of candy corn. A black fox crest on the front and a black 143 on the back.',
  '479940104': 'A Christmas jumper knitted into a football kit. Pine green with a knit texture, and a cream yoke across the chest where two foxes face a heart: the two of you, miles apart. Snowflakes and hearts run round the sleeves and the hem.',
  '479940112': 'A snowy night over a little log cabin, and a reindeer fox crest whose red nose lights the sleigh trail all the way home. Look closely by the cabin: Foxy is sitting in the snow, watching the sky for you.',
  '479940120': 'A glossy ceramic heart with Foxy in a Santa hat, holding a love letter. Add your two cities and it reads, say, NEW YORK ♥ LONDON, Christmas 2026. Leave them blank and it says Miles Apart, Close at Heart. The same design prints on both sides.',
  '436883133': 'Foxy with heart eyes, over HEART EYES, only for you. Our original design, and still the one people buy for each other most.',
};

/** The small label on a product photo: Pride, or the holiday a seasonal piece is for. */
export function badgeFor(name: string): { label: string; className: string } | null {
  if (/pride/i.test(name)) return { label: 'Pride', className: 'bg-fox-pink' };
  if (/cobweb|candy\s*corn/i.test(name)) return { label: 'Halloween', className: 'bg-[#E8641E]' };
  if (/fair\s*isle|red\s*nose|ornament/i.test(name)) return { label: 'Christmas', className: 'bg-[#1F5A40]' };
  return null;
}

/** Products made to be bought as a pair: one for you, one for them. */
export const PAIRS: Record<string, string> = {
  '478884090': '478884086', '478884086': '478884090',
  '436883186': '436883173', '436883173': '436883186',
  '475844798': '475844794', '475844794': '475844798',
};

/** Google requires a colour on clothing, so single-colourway kits name theirs here. */
export const KIT_COLOURS: Record<string, string> = {
  '475849115': 'Purple/Pink', '475844805': 'Navy/White', '475844798': 'Purple/Pink', '475844794': 'Pink/Purple',
  '443631285': 'Purple/Gold', '443578239': 'White/Black', '443540637': 'Teal/Orange', '443420345': 'Purple',
  '443266866': 'Navy', '443213452': 'Cream', '443164966': 'Purple',
  '479940069': 'Black/Orange', '479940099': 'Orange/Yellow', '479940104': 'Green/Cream', '479940112': 'Navy/White',
};

/** The product's own copy, followed by the Les Séparés-style story when the shop has one for it. */
export function productStory(p: Pick<ShopProduct, 'id'>, stories: Record<string, string> = {}) {
  return [PRODUCT_COPY[p.id], stories[p.id]].filter(Boolean).join(' ');
}

/** "Far Fox" plus the product name: every name already says what the product is (tee, mug, print…). */
export const productTitle = (p: Pick<ShopProduct, 'name'>) => `Far Fox ${p.name.replace(/"/g, '')}`.replace(/^Far Fox Far Fox/, 'Far Fox');

/** Other products from the same shop section first, then the rest, never the product itself. */
export function relatedProducts(p: ShopProduct, all: ShopProduct[], count = 4) {
  const others = all.filter((o) => o.id !== p.id);
  const pair = others.filter((o) => o.id === PAIRS[p.id]);
  const sameSection = others.filter((o) => o.id !== PAIRS[p.id] && shopCategoryOf(o.name) === shopCategoryOf(p.name));
  const rest = others.filter((o) => o.id !== PAIRS[p.id] && shopCategoryOf(o.name) !== shopCategoryOf(p.name));
  return [...pair, ...sameSection, ...rest].slice(0, count);
}

export type FeedItem = {
  id: string;
  itemGroupId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  price: string;
  productType: string;
  color?: string;
  size?: string;
  apparel: boolean;
};

const absolute = (path: string) => (path.startsWith('http') ? path : `${SITE}${path}`);

/**
 * One Merchant Center item per colour and size. Each link opens the product page on that variant,
 * so the price and photo Google checks are the ones the shopper sees.
 */
export function merchantFeedItems(products: ShopProduct[], stories: Record<string, string> = {}): FeedItem[] {
  const items: FeedItem[] = [];
  for (const p of products) {
    const kind = kindOf(p);
    const description = `${productStory(p, stories)} ${kind.facts.join('. ')}. Printed to order and shipped worldwide.`;
    const colours: (ShopColour | null)[] = p.colors?.length ? p.colors : [null];
    const sizes: (string | null)[] = p.sizes?.length ? p.sizes : [null];
    colours.forEach((colour, ci) => {
      for (const size of sizes) {
        const query = new URLSearchParams();
        if (colour) query.set('color', colour.name);
        if (size) query.set('size', size);
        const qs = query.toString();
        const front = colour?.image || p.image;
        const back = colour?.back || p.back;
        items.push({
          id: [p.id, colour ? `c${ci}` : '', size ? size.replace(/\s+/g, '') : ''].filter(Boolean).join('-'),
          itemGroupId: p.id,
          title: [productTitle(p), colour?.name, size].filter(Boolean).join(', '),
          description,
          link: `${productUrl(p)}${qs ? `?${qs}` : ''}`,
          imageLink: absolute(front),
          additionalImageLinks: back ? [absolute(back)] : [],
          price: `${p.price.toFixed(2)} ${p.currency || 'USD'}`,
          productType: kind.productType,
          color: colour?.name ?? KIT_COLOURS[p.id],
          size: size ?? undefined,
          apparel: kind.apparel,
        });
      }
    });
  }
  return items;
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** The feed as RSS 2.0 with Google's g: namespace, the format Merchant Center fetches on a schedule. */
export function merchantFeedXml(items: FeedItem[]) {
  const tag = (name: string, value?: string) => (value ? `<g:${name}>${xml(value)}</g:${name}>` : '');
  const entries = items.map((i) => [
    '<item>',
    tag('id', i.id), tag('item_group_id', i.itemGroupId),
    `<title>${xml(i.title)}</title>`, `<description>${xml(i.description)}</description>`, `<link>${xml(i.link)}</link>`,
    tag('image_link', i.imageLink), ...i.additionalImageLinks.map((l) => tag('additional_image_link', l)),
    tag('availability', 'in_stock'), tag('price', i.price), tag('condition', 'new'), tag('brand', 'Far Fox'),
    tag('identifier_exists', 'no'), tag('product_type', i.productType),
    tag('color', i.color), tag('size', i.size),
    i.apparel ? `${tag('gender', 'unisex')}${tag('age_group', 'adult')}` : '',
    '</item>',
  ].join('')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Far Fox Shop</title><link>${SITE}/shop/</link><description>Gifts for long-distance couples</description>\n${entries}\n</channel></rss>\n`;
}

export const formatPrice = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);
