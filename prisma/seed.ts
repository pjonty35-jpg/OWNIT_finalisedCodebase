/* OWNIT seed — run with `npm run db:seed`. Idempotent: clears and recreates demo data. */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const CAT = [
  { slug: "t-shirts", name: "T-Shirts", tagline: "The classic, reimagined.", sortOrder: 1 },
  { slug: "hoodies", name: "Hoodies", tagline: "Comfort meets identity.", sortOrder: 2 },
  { slug: "jackets", name: "Jackets", tagline: "Make a statement.", sortOrder: 3 },
  { slug: "bags", name: "Bags", tagline: "Carry your story.", sortOrder: 4 },
  { slug: "caps", name: "Caps", tagline: "Small detail. Big expression.", sortOrder: 5 },
  { slug: "jerseys", name: "Jerseys", tagline: "For teams. For dreamers.", sortOrder: 6 },
];

type ColorDef = { name: string; hex: string };
const COLORS: ColorDef[] = [
  { name: "Black", hex: "#101010" },
  { name: "White", hex: "#f2efe7" },
  { name: "Ash Grey", hex: "#b9b7b2" },
  { name: "Off White", hex: "#eae5da" },
  { name: "Navy", hex: "#1d2a45" },
  { name: "Forest", hex: "#2e4234" },
  { name: "Olive", hex: "#57583f" },
  { name: "Sand", hex: "#d8c9a8" },
  { name: "Sage", hex: "#a9ad9d" },
  { name: "Blush", hex: "#d9b8b0" },
];
const color = (name: string) => COLORS.find((c) => c.name === name)!;

const SIZES: Record<string, string[]> = {
  tees: ["XS", "S", "M", "L", "XL", "XXL"],
  one: ["One Size"],
};

interface ProductSeed {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  story: string;
  category: string;
  basePrice: number;
  colors: string[];
  sizes: string[];
  fits: string[];
  badge?: string;
  featured?: boolean;
  popularity: number;
  materials: string[];
  features: string[];
  care: string[];
  printSides: string[];
  method?: string;
}

const PRODUCTS: ProductSeed[] = [
  {
    slug: "essential-oversized-tee",
    name: "Essential Oversized Tee",
    subtitle: "240 GSM heavyweight cotton",
    description:
      "The one that started it all. A boxy, drapey oversized tee cut from 240 GSM combed cotton with a structured collar that holds its shape wash after wash.",
    story: "Designed as a blank canvas: clean front, generous print area, zero distraction.",
    category: "t-shirts",
    basePrice: 89900,
    colors: ["Black", "White", "Ash Grey", "Olive", "Off White"],
    sizes: SIZES.tees,
    fits: ["regular", "oversized"],
    badge: "Best Seller",
    featured: true,
    popularity: 98,
    materials: ["100% combed cotton, 240 GSM", "Reinforced shoulder tape", "Pre-shrunk, bio-washed"],
    features: ["Drop shoulder", "Ribbed knit collar", "Side-seamed construction"],
    care: ["Machine wash cold, inside out", "Do not bleach", "Iron on reverse, avoid print"],
    printSides: ["front", "back", "left", "right"],
  },
  {
    slug: "classic-regular-tee",
    name: "Classic Regular Tee",
    subtitle: "200 GSM everyday cotton",
    description:
      "A timeless regular-fit tee in soft 200 GSM cotton. The everyday canvas for your ideas.",
    story: "The piece every great design starts on.",
    category: "t-shirts",
    basePrice: 69900,
    colors: ["Black", "White", "Navy", "Sage", "Blush"],
    sizes: SIZES.tees,
    fits: ["regular"],
    popularity: 84,
    materials: ["100% cotton, 200 GSM", "Bio-washed finish"],
    features: ["Regular fit", "Taped neck", "Twin-needle hem"],
    care: ["Machine wash cold", "Tumble dry low"],
    printSides: ["front", "back"],
  },
  {
    slug: "studio-hoodie",
    name: "Studio Hoodie",
    subtitle: "400 GSM brushed fleece",
    description:
      "Heavyweight brushed-fleece hoodie with a double-lined hood and kangaroo pocket. Built for layering and late nights.",
    story: "Studio-tested warmth with a print area that means business.",
    category: "hoodies",
    basePrice: 199900,
    colors: ["Black", "Ash Grey", "Forest", "Off White", "Navy"],
    sizes: SIZES.tees,
    fits: ["regular", "oversized"],
    badge: "Most Loved",
    featured: true,
    popularity: 95,
    materials: ["80% cotton / 20% recycled poly, 400 GSM", "Brushed inner fleece", "Metal-free trims"],
    features: ["Double-lined hood", "Kangaroo pocket", "Ribbed cuffs and hem"],
    care: ["Machine wash cold, inside out", "Dry flat", "Do not iron print"],
    printSides: ["front", "back", "left", "right"],
  },
  {
    slug: "campus-zip-hoodie",
    name: "Campus Zip Hoodie",
    subtitle: "380 GSM full-zip fleece",
    description:
      "A full-zip hoodie with matte hardware and a slim-yet-easy fit. Your art, front and back, with a zipper that never snags the print.",
    story: "Made for campus days and city nights.",
    category: "hoodies",
    basePrice: 229900,
    colors: ["Black", "Ash Grey", "Olive"],
    sizes: SIZES.tees,
    fits: ["regular"],
    popularity: 71,
    materials: ["80% cotton / 20% recycled poly, 380 GSM"],
    features: ["YKK-style matte zip", "Split kangaroo pocket", "Storm cuffs"],
    care: ["Machine wash cold", "Close zip before washing"],
    printSides: ["front", "back"],
  },
  {
    slug: "coach-jacket",
    name: "Coach Jacket",
    subtitle: "Water-repellent shell",
    description:
      "A classic coach silhouette in a matte water-repellent shell with a satin-smooth lining and snap closure.",
    story: "Statement outerwear with real print presence.",
    category: "jackets",
    basePrice: 349900,
    colors: ["Black", "Off White", "Navy", "Olive"],
    sizes: SIZES.tees,
    fits: ["regular", "oversized"],
    badge: "Statement Piece",
    featured: true,
    popularity: 77,
    materials: ["Water-repellent poly shell", "Quilted satin lining", "Snap-front closure"],
    features: ["Elastic cuffs", "Two-way front pockets", "Embroidery-ready chest panel"],
    care: ["Spot clean preferred", "Do not tumble dry"],
    printSides: ["front", "back"],
    method: "SUBLIMATION",
  },
  {
    slug: "utility-shacket",
    name: "Utility Shacket",
    subtitle: "14 oz cotton twill",
    description:
      "Part shirt, part jacket. Heavy cotton twill, boxy cut, double chest pockets, garment-dyed for depth.",
    story: "The layer that carries a whole look.",
    category: "jackets",
    basePrice: 299900,
    colors: ["Olive", "Black", "Sand"],
    sizes: SIZES.tees,
    fits: ["oversized"],
    popularity: 63,
    materials: ["100% cotton twill, 14 oz", "Garment-dyed", "Corozo buttons"],
    features: ["Double chest pockets", "Boxy silhouette", "Back yoke"],
    care: ["Machine wash cold", "Line dry"],
    printSides: ["front", "back"],
  },
  {
    slug: "canvas-tote",
    name: "Canvas Tote",
    subtitle: "16 oz heavy canvas",
    description:
      "A structured, heavy-canvas tote with reinforced bases and handles long enough to shoulder comfortably.",
    story: "Carry groceries, sketchbooks, or a whole identity.",
    category: "bags",
    basePrice: 79900,
    colors: ["Sand", "Black", "Off White"],
    sizes: SIZES.one,
    fits: ["regular"],
    badge: "Campus Favourite",
    featured: true,
    popularity: 82,
    materials: ["16 oz cotton canvas", "Reinforced base stitching", "Flat woven handles"],
    features: ["Roomy main compartment", "Inner slip pocket", "Large front print area"],
    care: ["Spot clean", "Air dry"],
    printSides: ["front", "back"],
  },
  {
    slug: "crossbody-sling",
    name: "Crossbody Sling",
    subtitle: "Ripstop nylon",
    description:
      "A compact sling with a water-resistant ripstop shell, adjustable strap, and a front panel made for small, bold marks.",
    story: "Small canvas, loud voice.",
    category: "bags",
    basePrice: 129900,
    colors: ["Black", "Forest", "Navy"],
    sizes: SIZES.one,
    fits: ["regular"],
    popularity: 58,
    materials: ["Water-resistant ripstop nylon", "Webbing straps", "YKK-style zips"],
    features: ["Adjustable crossbody strap", "Hidden back pocket", "Front print panel"],
    care: ["Spot clean"],
    printSides: ["front"],
  },
  {
    slug: "classic-cap",
    name: "Classic Cap",
    subtitle: "Brushed cotton twill",
    description:
      "A six-panel cap with a pre-curved brim and metal snap closure. Small embroidery area, maximum attitude.",
    story: "The quiet flex of a small mark, done right.",
    category: "caps",
    basePrice: 59900,
    colors: ["Black", "Off White", "Olive", "Navy"],
    sizes: SIZES.one,
    fits: ["regular"],
    popularity: 74,
    materials: ["Brushed cotton twill", "Structured six panels", "Metal snap closure"],
    features: ["Pre-curved brim", "Moisture-wicking band", "Small-area embroidery"],
    care: ["Hand wash", "Air dry"],
    printSides: ["front"],
    method: "EMBROIDERY",
  },
  {
    slug: "studio-beanie",
    name: "Studio Beanie",
    subtitle: "Ribbed knit",
    description: "A chunky ribbed knit beanie with a folded cuff and a woven-feel label area.",
    story: "Top off the fit.",
    category: "caps",
    basePrice: 49900,
    colors: ["Black", "Ash Grey", "Blush"],
    sizes: SIZES.one,
    fits: ["regular"],
    popularity: 49,
    materials: ["Acrylic rib knit", "Double-layer cuff"],
    features: ["Unisex fit", "Faux leather patch area"],
    care: ["Hand wash cold"],
    printSides: ["front"],
    method: "EMBROIDERY",
  },
  {
    slug: "number-07-jersey",
    name: "Number 07 Jersey",
    subtitle: "Pro-cut mesh",
    description:
      "A pro-cut mesh jersey with twill-ready numbers and team-ready colour blocking. Your name, your number, your rules.",
    story: "Made for five-a-side legends and court regulars.",
    category: "jerseys",
    basePrice: 149900,
    colors: ["Black", "White", "Forest"],
    sizes: SIZES.tees,
    fits: ["regular", "oversized"],
    badge: "Team Ready",
    featured: true,
    popularity: 80,
    materials: ["Recycled performance mesh", "Flatlock seams", "Dropped tail hem"],
    features: ["Name + number print areas", "Breathable mesh", "Tagless neck label"],
    care: ["Machine wash cold", "Do not iron numbers"],
    printSides: ["front", "back"],
    method: "DTF",
  },
  {
    slug: "court-classic-jersey",
    name: "Court Classic Jersey",
    subtitle: "Retro mesh cut",
    description: "A retro-cut jersey with side trim and a large back number zone for full personalisation.",
    story: "Court classics never die — they get customised.",
    category: "jerseys",
    basePrice: 139900,
    colors: ["White", "Navy", "Black"],
    sizes: SIZES.tees,
    fits: ["regular"],
    popularity: 55,
    materials: ["Performance mesh", "Contrast side trim"],
    features: ["Large back number zone", "Ribbed armholes"],
    care: ["Machine wash cold"],
    printSides: ["front", "back"],
    method: "DTF",
  },
];

const PRINT_AREA: Record<string, { w: number; h: number; oy?: number }> = {
  front: { w: 1200, h: 1500 },
  back: { w: 1200, h: 1500 },
  left: { w: 420, h: 560 },
  right: { w: 420, h: 560 },
};

const HANDLES = ["jonty.exe", "meera.jpg", "kushal.x", "tamanna.art", "thea.creates", "vihaan.JPG", "saanvi.creates", "aditya.07", "yardardary", "niisarg.png", "pranav.visuals", "kaavya.jpeg"];

async function main() {
  console.log("Seeding OWNIT…");

  // Wipe (order matters for FKs)
  await db.$transaction([
    db.auditLog.deleteMany(), db.rewardTransaction.deleteMany(), db.rewardAccount.deleteMany(),
    db.notification.deleteMany(), db.supportTicket.deleteMany(), db.like.deleteMany(), db.follow.deleteMany(),
    db.inspirationPost.deleteMany(), db.designVersion.deleteMany(), db.design.deleteMany(),
    db.orderEvent.deleteMany(), db.productionJob.deleteMany(), db.refund.deleteMany(), db.shipment.deleteMany(),
    db.payment.deleteMany(), db.orderItem.deleteMany(), db.order.deleteMany(),
    db.cartItem.deleteMany(), db.cart.deleteMany(), db.wishlistItem.deleteMany(), db.wishlist.deleteMany(),
    db.address.deleteMany(), db.review.deleteMany(), db.session.deleteMany(), db.magicLoginToken.deleteMany(),
    db.journalPost.deleteMany(), db.faq.deleteMany(), db.siteContent.deleteMany(), db.coupon.deleteMany(),
    db.productPrintArea.deleteMany(), db.product3dAsset.deleteMany(), db.productImage.deleteMany(),
    db.productVariant.deleteMany(), db.collection.deleteMany(), db.product.deleteMany(), db.category.deleteMany(),
    db.user.deleteMany(),
  ]);

  // Users
  const password = await bcrypt.hash("ownit123", 10);
  const users = await Promise.all(
    HANDLES.map((h, i) =>
      db.user.create({
        data: {
          email: `${h.split(".")[0]}@ownit.test`,
          name: h.split(".")[0].replace(/^\w/, (c) => c.toUpperCase()),
          passwordHash: password,
          role: i === 0 ? "customer" : "customer",
        },
      })
    )
  );
  const admin = await db.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "admin@ownit.test",
      name: "OWNIT Admin",
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "ownit-admin-1", 10),
      role: "admin",
    },
  });
  await Promise.all(users.map((u) => db.rewardAccount.create({ data: { userId: u.id, points: 120 } })));

  // Categories
  const cats = await Promise.all(CAT.map((c) => db.category.create({ data: c })));
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));

  // Collections
  const collections = await Promise.all([
    db.collection.create({
      data: {
        slug: "campus-drop-01",
        name: "Campus Drop 01",
        tagline: "First semester of self-expression.",
        description: "The pieces we launched with, made for lecture halls and late-night studios.",
        featured: true,
      },
    }),
    db.collection.create({
      data: {
        slug: "quiet-luxury",
        name: "Quiet Luxury",
        tagline: "Small marks. Heavy fabrics.",
        description: "Understated palettes and premium blanks for tonal, tonal-on-tonal styling.",
        featured: true,
      },
    }),
    db.collection.create({
      data: {
        slug: "game-day",
        name: "Game Day",
        tagline: "Jerseys built for bragging rights.",
        description: "Name, number, team, creed. Built for the season.",
        featured: true,
      },
    }),
  ]);

  // Products + variants + print areas
  const created: Record<string, { id: string; slug: string; name: string; basePrice: number }> = {};
  for (const p of PRODUCTS) {
    const product = await db.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description,
        story: p.story,
        basePrice: p.basePrice,
        categoryId: catBySlug[p.category].id,
        materials: JSON.stringify(p.materials),
        features: JSON.stringify(p.features),
        care: JSON.stringify(p.care),
        sizeChart: JSON.stringify([
          { size: "XS", chest: "32-34", length: 26 },
          { size: "S", chest: "35-37", length: 27 },
          { size: "M", chest: "38-40", length: 28 },
          { size: "L", chest: "41-43", length: 29 },
          { size: "XL", chest: "44-46", length: 30 },
          { size: "XXL", chest: "47-49", length: 31 },
        ]),
        fits: JSON.stringify(p.fits),
        colors: JSON.stringify(p.colors.map((c) => color(c))),
        badge: p.badge,
        popularity: p.popularity,
        featured: !!p.featured,
      },
    });
    created[p.slug] = { id: product.id, slug: p.slug, name: p.name, basePrice: p.basePrice };

    await db.productImage.create({
      data: { productId: product.id, url: `/img/products/${p.slug}.svg`, alt: p.name, side: "front", sortOrder: 0 },
    });

    await db.product3dAsset.create({
      data: { productId: product.id, kind: "parametric", meta: JSON.stringify({ silhouette: p.category }) },
    });

    for (const side of p.printSides) {
      const area = PRINT_AREA[side];
      await db.productPrintArea.create({
        data: {
          productId: product.id,
          side,
          widthPx: area.w,
          heightPx: area.h,
          offsetY: side === "back" ? -20 : side === "left" || side === "right" ? 0 : 0,
          safeZonePct: 6,
          maxArtworkMb: 8,
          minImagePx: 600,
          method: p.method ?? "DTG",
        },
      });
    }

    for (const colorName of p.colors) {
      const c = color(colorName);
      for (const size of p.sizes) {
        await db.productVariant.create({
          data: {
            productId: product.id,
            sku: `${p.slug.toUpperCase().slice(0, 10)}-${c.name.toUpperCase().replace(/\s/g, "")}-${size.toUpperCase()}`,
            colorName: c.name,
            colorHex: c.hex,
            size,
            fit: p.fits[0],
            stock: 18 + ((p.popularity + colorName.length) % 30),
          },
        });
      }
    }

    await db.product.update({
      where: { id: product.id },
      data: { collections: { connect: collections.slice(0, p.featured ? 2 : 1).map((c) => ({ id: c.id })) } },
    });
  }

  // Demo designs
  interface DemoDesign {
    name: string;
    ownerIdx: number;
    productSlug: string;
    color: string;
    side: "front" | "back";
    lines: { text: string; size: number; bold: boolean; y: number }[];
    stickers?: { id: string; x: number; y: number; size: number }[];
    likes: number;
    views: number;
    remixes: number;
    featured?: boolean;
    trending?: boolean;
    category: string;
    title: string;
  }

  const demoDesigns: DemoDesign[] = [
    {
      name: "Higher Than Yesterday", ownerIdx: 0, productSlug: "studio-hoodie", color: "Black", side: "back",
      lines: [{ text: "HIGHER", size: 120, bold: true, y: 260 }, { text: "THAN", size: 120, bold: true, y: 396 }, { text: "YESTERDAY", size: 120, bold: true, y: 532 }],
      stickers: [{ id: "star", x: 640, y: 300, size: 90 }],
      likes: 2400, views: 12000, remixes: 34, featured: true, trending: true, category: "streetwear", title: "Higher Than Yesterday",
    },
    {
      name: "Good People Good Places", ownerIdx: 1, productSlug: "studio-hoodie", color: "Off White", side: "back",
      lines: [{ text: "GOOD", size: 110, bold: true, y: 240 }, { text: "PEOPLE", size: 110, bold: true, y: 366 }, { text: "GOOD", size: 110, bold: true, y: 492 }, { text: "PLACES", size: 110, bold: true, y: 618 }],
      likes: 1800, views: 9800, remixes: 21, featured: true, trending: true, category: "typography", title: "Good People Good Places",
    },
    {
      name: "Same Dreams Bigger Plans", ownerIdx: 2, productSlug: "studio-hoodie", color: "Forest", side: "back",
      lines: [{ text: "SAME", size: 100, bold: true, y: 300 }, { text: "DREAMS", size: 100, bold: true, y: 416 }, { text: "BIGGER", size: 100, bold: true, y: 532 }, { text: "PLANS", size: 100, bold: true, y: 648 }],
      stickers: [{ id: "globe", x: 600, y: 810, size: 72 }],
      likes: 3100, views: 15200, remixes: 47, featured: true, trending: true, category: "streetwear", title: "Same Dreams",
    },
    {
      name: "A Brighter Me", ownerIdx: 3, productSlug: "essential-oversized-tee", color: "White", side: "back",
      lines: [{ text: "A BRIGHTER", size: 88, bold: true, y: 280 }, { text: "ME", size: 88, bold: true, y: 384 }],
      stickers: [{ id: "heart", x: 600, y: 540, size: 110 }],
      likes: 2100, views: 11000, remixes: 26, featured: true, trending: true, category: "aesthetic", title: "A Brighter Me",
    },
    {
      name: "Lost But Exploring", ownerIdx: 4, productSlug: "studio-hoodie", color: "Black", side: "back",
      lines: [{ text: "LOST", size: 96, bold: true, y: 300 }, { text: "BUT", size: 96, bold: true, y: 412 }, { text: "EXPLORING", size: 96, bold: true, y: 524 }],
      stickers: [{ id: "globe", x: 600, y: 700, size: 84 }],
      likes: 2900, views: 13400, remixes: 39, featured: true, trending: true, category: "nature", title: "Lost But Exploring",
    },
    {
      name: "Mental Health Matters", ownerIdx: 5, productSlug: "classic-regular-tee", color: "Black", side: "front",
      lines: [{ text: "MENTAL", size: 100, bold: true, y: 340 }, { text: "HEALTH", size: 100, bold: true, y: 456 }, { text: "MATTERS", size: 100, bold: true, y: 572 }],
      likes: 4200, views: 21000, remixes: 88, trending: true, category: "minimal", title: "Mental Health Matters",
    },
    {
      name: "Still Here Still Growing", ownerIdx: 6, productSlug: "essential-oversized-tee", color: "White", side: "front",
      lines: [{ text: "STILL HERE", size: 84, bold: true, y: 340 }, { text: "STILL", size: 84, bold: true, y: 440 }, { text: "GROWING", size: 84, bold: true, y: 540 }],
      stickers: [{ id: "star", x: 600, y: 700, size: 70 }],
      likes: 2900, views: 14900, remixes: 41, trending: true, category: "illustration", title: "Still Here Still Growing",
    },
    {
      name: "Number 77", ownerIdx: 7, productSlug: "number-07-jersey", color: "Forest", side: "front",
      lines: [{ text: "77", size: 320, bold: true, y: 420 }],
      likes: 3100, views: 15600, remixes: 52, trending: true, category: "sports", title: "77",
    },
    {
      name: "Collect Moments", ownerIdx: 8, productSlug: "canvas-tote", color: "Sand", side: "front",
      lines: [{ text: "COLLECT", size: 76, bold: true, y: 480 }, { text: "MOMENTS NOT", size: 76, bold: true, y: 572 }, { text: "THINGS", size: 76, bold: true, y: 664 }],
      likes: 2300, views: 11800, remixes: 29, trending: true, category: "travel", title: "Collect Moments",
    },
    {
      name: "Midnight Thoughts", ownerIdx: 9, productSlug: "essential-oversized-tee", color: "White", side: "front",
      lines: [{ text: "MIDNIGHT", size: 92, bold: true, y: 360 }, { text: "THOUGHTS", size: 92, bold: true, y: 468 }],
      stickers: [{ id: "globe", x: 600, y: 640, size: 64 }],
      likes: 1600, views: 8800, remixes: 18, category: "aesthetic", title: "Midnight Thoughts",
    },
    {
      name: "Better Days Ahead", ownerIdx: 10, productSlug: "canvas-tote", color: "Sand", side: "front",
      lines: [{ text: "GOOD DAYS", size: 72, bold: true, y: 480 }, { text: "AHEAD", size: 72, bold: true, y: 566 }],
      likes: 1400, views: 7900, remixes: 15, category: "typography", title: "Good Days Ahead",
    },
    {
      name: "Grow At Your Own Pace", ownerIdx: 11, productSlug: "studio-hoodie", color: "Black", side: "front",
      lines: [{ text: "GROW AT", size: 80, bold: true, y: 320 }, { text: "YOUR OWN", size: 80, bold: true, y: 416 }, { text: "PACE", size: 80, bold: true, y: 512 }],
      likes: 1900, views: 9700, remixes: 23, category: "streetwear", title: "Grow At Your Own Pace",
    },
  ];

  const designIds: string[] = [];
  for (const d of demoDesigns) {
    const product = created[d.productSlug];
    const owner = users[d.ownerIdx];
    const c = color(d.color);
    const elements: unknown[] = [];
    let z = 0;
    for (const line of d.lines) {
      elements.push({
        id: `el_${Math.random().toString(36).slice(2, 10)}`,
        type: "text",
        side: d.side,
        x: 600,
        y: line.y,
        scale: 1,
        rotation: 0,
        opacity: 1,
        z: z++,
        locked: false,
        visible: true,
        text: line.text,
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: line.size,
        color: c.hex === "#f2efe7" || c.hex === "#eae5da" || c.hex === "#b9b7b2" ? "#141414" : "#f5f2ea",
        bold: line.bold,
        italic: false,
        underline: false,
        align: "center",
        letterSpacing: 2,
      });
    }
    for (const s of d.stickers ?? []) {
      elements.push({
        id: `el_${Math.random().toString(36).slice(2, 10)}`,
        type: "sticker",
        side: d.side,
        x: s.x,
        y: s.y,
        scale: 1,
        rotation: 0,
        opacity: 1,
        z: z++,
        locked: false,
        visible: true,
        stickerId: s.id,
        size: s.size,
      });
    }
    const state = {
      colorName: c.name,
      colorHex: c.hex,
      size: "L",
      fit: "oversized",
      elements,
      sides: [d.side],
      activeSide: d.side,
    };
    const design = await db.design.create({
      data: {
        ownerId: owner.id,
        productId: product.id,
        name: d.name,
        state: JSON.stringify(state),
        previewUrl: `/img/designs/${slugifyName(d.name)}.svg`,
        currentVersion: 1,
      },
    });
    await db.designVersion.create({ data: { designId: design.id, version: 1, state: JSON.stringify(state) } });
    designIds.push(design.id);

    await db.inspirationPost.create({
      data: {
        designId: design.id,
        creatorId: owner.id,
        title: d.title,
        handle: HANDLES[d.ownerIdx],
        productType: PRODUCTS.find((p) => p.slug === d.productSlug)!.name,
        category: d.category,
        imageUrl: `/img/designs/${slugifyName(d.name)}.svg`,
        side: d.side,
        likes: d.likes,
        views: d.views,
        remixes: d.remixes,
        featured: !!d.featured,
        trending: !!d.trending,
      },
    });
  }

  // Address + orders for the first user (Jonty)
  const jonty = users[0];
  const addr = await db.address.create({
    data: {
      userId: jonty.id,
      label: "Home",
      fullName: "Jonty Malik",
      phone: "+91 98200 00000",
      line1: "204, Horizon Heights, KG Marg",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "IN",
      isDefault: true,
    },
  });

  const orderDefs: { status: string; paymentStatus: string; days: number; items: { slug: string; designIdx: number; qty: number }[]; shipping: string }[] = [
    { status: "out_for_delivery", paymentStatus: "paid", days: 3, items: [{ slug: "essential-oversized-tee", designIdx: 9, qty: 1 }, { slug: "classic-cap", designIdx: -1, qty: 1 }], shipping: "standard" },
    { status: "delivered", paymentStatus: "paid", days: 20, items: [{ slug: "studio-hoodie", designIdx: 0, qty: 1 }], shipping: "express" },
    { status: "delivered", paymentStatus: "paid", days: 45, items: [{ slug: "canvas-tote", designIdx: 10, qty: 2 }, { slug: "classic-cap", designIdx: -1, qty: 1 }], shipping: "standard" },
    { status: "cancelled", paymentStatus: "refunded", days: 60, items: [{ slug: "coach-jacket", designIdx: -1, qty: 1 }], shipping: "standard" },
  ];

  for (let i = 0; i < orderDefs.length; i++) {
    const def = orderDefs[i];
    const subtotal = def.items.reduce((sum, it) => {
      const p = created[it.slug];
      const extra = it.designIdx >= 0 ? 9900 : 0;
      return sum + (p.basePrice + extra) * it.qty;
    }, 0);
    const discount = i === 1 ? Math.round(subtotal * 0.1) : 0;
    const ship = def.shipping === "express" ? 24900 : subtotal - discount >= 299900 ? 0 : 9900;
    const tax = Math.round((subtotal - discount) * 0.05);
    const total = subtotal - discount + ship + tax;
    const created_at = new Date(Date.now() - def.days * 86400000);
    const order = await db.order.create({
      data: {
        number: `OD${8420 + i * 777}`,
        userId: jonty.id,
        email: jonty.email,
        status: def.status,
        paymentStatus: def.paymentStatus,
        subtotal, discount, shipping: ship, tax, total,
        shippingAddressJson: JSON.stringify(addr),
        shippingMethod: def.shipping,
        provider: "mock",
        trackingNumber: def.status === "cancelled" ? null : `OWNIT${1000 + i}`,
        createdAt: created_at,
        events: {
          create: [
            { status: "pending_payment", message: "Order created", createdAt: created_at },
            { status: "paid", message: "Payment confirmed", createdAt: new Date(created_at.getTime() + 300000) },
            ...(def.status !== "cancelled"
              ? [
                  { status: "artwork_processing", message: "Artwork queued for production", createdAt: new Date(created_at.getTime() + 3600000) },
                  { status: def.status, message: "Status updated", createdAt: new Date(created_at.getTime() + 7200000) },
                ]
              : [{ status: "cancelled", message: "Order cancelled", createdAt: new Date(created_at.getTime() + 86400000) }]),
          ],
        },
        items: {
          create: def.items.map((it) => {
            const p = created[it.slug];
            const custom = it.designIdx >= 0;
            return {
              productId: p.id,
              name: p.name,
              colorName: "Black",
              size: custom ? "L" : "One Size",
              sides: custom ? JSON.stringify(["front"]) : "[]",
              quantity: it.qty,
              unitPrice: p.basePrice + (custom ? 9900 : 0),
              previewUrl: custom ? `/img/designs/${slugifyName(demoDesigns[it.designIdx].name)}.svg` : `/img/products/${it.slug}.svg`,
            };
          }),
        },
      },
    });
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: "mock",
        amount: total,
        status: def.paymentStatus === "refunded" ? "refunded" : "paid",
        providerRef: `mock_${order.number}`,
      },
    });
    if (def.status !== "cancelled") {
      await db.shipment.create({
        data: {
          orderId: order.id,
          carrier: "OWNIT Express",
          trackingNumber: `OWNIT${2000 + i}`,
          status: def.status === "delivered" ? "delivered" : def.status === "out_for_delivery" ? "out_for_delivery" : "in_transit",
        },
      });
      await db.productionJob.create({
        data: { orderId: order.id, status: def.status === "delivered" ? "shipped" : "in_production", method: "DTG", artworkUrl: `/img/designs/${slugifyName(demoDesigns[def.items[0].designIdx >= 0 ? def.items[0].designIdx : 0].name)}.svg` },
      });
    }
  }

  // Coupon, FAQ, journal
  await db.coupon.create({ data: { code: "FIRSTOWN", kind: "percent", value: 10, minSubtotal: 99900, active: true } });
  await db.coupon.create({ data: { code: "CAMPUS100", kind: "fixed", value: 10000, minSubtotal: 149900, active: true } });

  const faqs: [string, string, string][] = [
    ["Ordering", "How does OWNIT work?", "Pick a premium blank, design your artwork in the studio, preview it on a 3D model, and we produce and ship it to you. One piece at a time, made only for you."],
    ["Ordering", "Do I need an account to order?", "You can explore everything without an account. Sign in when you are ready to save designs or check out — it keeps your designs safe across devices."],
    ["Design", "Who owns the artwork I upload?", "You do. You keep full ownership of your original artwork. By ordering, you simply give us permission to print it on your garment."],
    ["Design", "What file types can I upload?", "PNG, JPG, WebP and SVG up to 8 MB. For crisp prints, aim for at least 600 px on the longer edge."],
    ["Production", "How long does production take?", "Each piece is made to order — production usually wraps in 3–5 working days before your parcel ships."],
    ["Shipping", "Where do you deliver?", "We ship across India at launch, with international delivery rolling out region by region."],
    ["Shipping", "How much is shipping?", "Standard shipping is ₹99, free on orders above ₹2,999. Express is ₹249."],
    ["Returns", "Can I return a custom piece?", "Because every piece is made one-of-one, we only accept returns for defects or print errors on our side — reported within 7 days of delivery."],
  ];
  for (let i = 0; i < faqs.length; i++) {
    await db.faq.create({ data: { section: faqs[i][0], question: faqs[i][1], answer: faqs[i][2], sortOrder: i } });
  }

  const posts: { slug: string; title: string; excerpt: string; tag: string; body: string }[] = [
    {
      slug: "design-it-own-it-wear-it",
      title: "Design It. Own It. Wear It.",
      excerpt: "Why we built a platform where the customer is the creative director.",
      tag: "Brand",
      body:
        "Every piece of clothing tells a story. Most of the time, it is someone else's.\n\nOWNIT started with a simple frustration: the ideas in our heads had nowhere to go. We could imagine the perfect tee — the line, the phrase, the artwork that meant something to us — but we could not wear it.\n\nSo we built the studio. A place where the only brief is your own. Premium blanks, real production, 3D previews that show exactly what arrives at your door.\n\nDesign it. Own it. Wear it. That's the whole philosophy.",
    },
    {
      slug: "anatomy-of-a-240gsm-tee",
      title: "The Anatomy of a 240 GSM Tee",
      excerpt: "What heavyweight cotton actually means, and why it matters.",
      tag: "Quality",
      body:
        "GSM — grams per square metre — is the single biggest indicator of how a tee will feel, drape, and age.\n\nUnder 180 GSM sits the giveaway tier: thin, translucent, prone to twisting in the wash. At 240 GSM, cotton gains structure. The collar stands. The hem hangs straight. Print sits on the fabric instead of disappearing into it.\n\nWe bio-wash every roll before cutting, so the tee you design on is the tee that arrives — no shrinking surprises.",
    },
    {
      slug: "from-notebook-to-neighborhood",
      title: "From Notebook to Neighbourhood",
      excerpt: "How campus creators are turning sketches into streetwear.",
      tag: "Community",
      body:
        "The best designs we have produced never came from a design agency. They came from dorm rooms, hostel common rooms, and the backs of notebooks.\n\nThis is a generation that does not wait for permission. If the merch doesn't exist, they make it. If the slogan isn't printed yet, they print it.\n\nOur job is simple: give them a canvas that deserves the idea.",
    },
  ];
  for (const p of posts) {
    await db.journalPost.create({ data: { ...p, published: true, authorId: admin.id } });
  }

  await db.siteContent.createMany({
    data: [
      { key: "hero.title", value: "DESIGN IT.\nOWN IT.\nWEAR IT." },
      { key: "hero.sub", value: "Your imagination, on premium apparel. Create, customise and wear what's truly yours." },
    ],
  });

  console.log("Seed complete:", {
    users: users.length + 1,
    products: Object.keys(created).length,
    designs: designIds.length,
    orders: orderDefs.length,
  });
}

function slugifyName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
