export type BlogContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "image";
      src: string;
      alt: string;
      caption: string;
    }
  | {
      type: "quote";
      text: string;
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    };

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  heroImage: string;
  heroImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  atAGlance: string[];
  faqItems?: BlogFaqItem[];
  relatedSlugs: string[];
  content: BlogContentBlock[];
};

export const blogPosts: BlogPost[] = [
  {
    title:
      "Siargao Airport (IAO) To General Luna Transfer Guide: Shared Vs Private",
    slug: "siargao-airport-general-luna-transfer-guide",
    excerpt:
      "A practical 2026 guide to getting from Sayak Airport to General Luna, with route times, real price ranges, and who should choose shared or private transfers.",
    category: "Airport Tips",
    tags: [
      "siargao airport transfer",
      "iao to general luna",
      "shared vs private van",
    ],
    publishedAt: "2026-02-24",
    updatedAt: "2026-02-24",
    readingTimeMinutes: 10,
    heroImage: "/blog/placeholders/airport-transfer-guide-hero.png",
    heroImageAlt:
      "PLACEHOLDER: replace with real photo of airport transfer from IAO to General Luna",
    seoTitle:
      "Siargao Airport To General Luna Transfer: Shared Vs Private (2026)",
    seoDescription:
      "Compare shared vans, private vans, tricycles, and bus routes from Siargao Airport to General Luna with practical prices, times, and booking tips.",
    atAGlance: [
      "Shared airport vans are usually the cheapest option at around PHP 300 per person to General Luna.",
      "Private vans are typically around PHP 2,500 to PHP 3,000 total and leave on your schedule.",
      "Airport to General Luna usually takes about 45 to 60 minutes depending on traffic and weather.",
      "Bring cash and confirm all fees up front because no ride-hailing apps or metered taxis operate on the island.",
    ],
    faqItems: [
      {
        question: "How long is the trip from Siargao Airport to General Luna?",
        answer:
          "Most airport-to-General Luna transfers take around 45 to 60 minutes. Road conditions, weather, and stop count can change timing slightly.",
      },
      {
        question: "How much is a shared airport van to General Luna?",
        answer:
          "Shared vans are commonly around PHP 300 per person for General Luna routes, though rates can vary by provider and season.",
      },
      {
        question: "How much is a private airport transfer in Siargao?",
        answer:
          "A private van is often around PHP 2,500 to PHP 3,000 total one-way to General Luna, depending on group size, area, and time.",
      },
      {
        question: "Is there a direct bus from IAO Airport to General Luna?",
        answer:
          "There is no direct airport bus in the way most first-timers expect. Public options usually involve going via Dapa first, then riding onward.",
      },
      {
        question: "Should I pre-book airport transfer in Siargao?",
        answer:
          "Yes, especially in peak months and late flight windows. Pre-booking reduces waiting and helps you confirm fixed pricing before arrival.",
      },
      {
        question: "Are there hidden airport transfer fees in Siargao?",
        answer:
          "There are generally no toll-style road fees, but some providers can charge extras for remote drop-offs, odd hours, or bulky gear. Confirm total fare before boarding.",
      },
      {
        question: "Can I pay by card for airport transport in Siargao?",
        answer:
          "Cash remains the safest assumption for many local rides. Bring enough Philippine pesos for your transfer and arrival incidentals.",
      },
      {
        question: "What is best for families or surf groups?",
        answer:
          "Private vans are usually best for families and surf groups because of luggage space, direct routing, and fewer transfer frictions.",
      },
      {
        question: "What should I send before booking a transfer?",
        answer:
          "Send flight number, arrival time, destination, passenger count, and luggage details. This helps providers match vehicle type and timing accurately.",
      },
      {
        question: "Can private transfers track delayed flights?",
        answer:
          "Many providers do, but you should confirm this before paying. Ask how they handle late arrivals and whether schedule changes add fees.",
      },
    ],
    relatedSlugs: [
      "siargao-airport-transfer-first-timer-guide",
      "family-friendly-siargao-day-routes",
      "general-luna-food-guide",
    ],
    content: [
      {
        type: "paragraph",
        text: "If you are arriving at Sayak Airport (IAO) and heading to General Luna, your first transfer choice can shape your whole trip. Most travelers choose between a shared van and a private van, but there are also local options like tricycles, habal-habal, and bus routes via Dapa.",
      },
      {
        type: "heading",
        text: "Quick Answer",
      },
      {
        type: "paragraph",
        text: "For most first-time visitors, shared airport vans are the lowest-cost option, usually around PHP 300 per person to General Luna. Private vans are usually around PHP 2,500 to PHP 3,000 total, but they leave on your schedule and avoid shared stops. Typical transfer time is around 45 to 60 minutes.",
      },
      {
        type: "image",
        src: "/blog/placeholders/airport-transfer-guide-inline-1.png",
        alt: "PLACEHOLDER: replace with real photo of IAO airport arrival area",
        caption:
          "Placeholder image: replace with a real airport pickup or arrivals photo.",
      },
      {
        type: "heading",
        text: "Transfer Options From Sayak Airport (IAO)",
      },
      {
        type: "heading",
        text: "1) Shared Airport Van",
      },
      {
        type: "paragraph",
        text: "Shared vans are usually parked near arrivals and often run fixed per-person pricing to General Luna. They are popular because they are affordable and direct enough for most visitors.",
      },
      {
        type: "list",
        items: [
          "Typical cost: around PHP 300 per person.",
          "Travel time: around 45 to 60 minutes to General Luna.",
          "Best for: solo or budget travelers with flexible timing.",
          "Tradeoff: may wait to fill seats and may stop at several accommodations.",
        ],
      },
      {
        type: "heading",
        text: "2) Private Van Transfer",
      },
      {
        type: "paragraph",
        text: "Private vans are the easiest option when you want predictable timing, direct drop-off, and less arrival friction. This is often the best fit for families, groups, and travelers with more luggage.",
      },
      {
        type: "list",
        items: [
          "Typical cost: around PHP 2,500 to PHP 3,000 total for one-way airport transfer.",
          "Travel time: about 45 to 60 minutes to General Luna with no shared stops.",
          "Best for: families, surf groups, late-night arrivals, and first-time visitors.",
          "Tradeoff: higher total price than shared rides.",
        ],
      },
      {
        type: "heading",
        text: "3) Tricycle or Local Multicab",
      },
      {
        type: "paragraph",
        text: "Tricycles can work for very light travel and short hops, but comfort and luggage space are limited for an airport-to-General Luna run.",
      },
      {
        type: "list",
        items: [
          "Typical total cost to General Luna: around PHP 400 to PHP 600, sometimes higher depending on negotiation and time.",
          "Best for: very light luggage and small groups with flexible expectations.",
          "Tradeoff: less comfort for longer rides and weather exposure.",
        ],
      },
      {
        type: "heading",
        text: "4) Habal-Habal (Motorbike Taxi)",
      },
      {
        type: "paragraph",
        text: "Habal-habal can be practical for local short-distance movement, but it is usually not ideal for airport arrivals with luggage.",
      },
      {
        type: "list",
        items: [
          "Typical airport-to-General Luna estimates: roughly PHP 300 to PHP 400 per bike.",
          "Best for: light solo riders comfortable with motorbike travel.",
          "Tradeoff: limited luggage handling and lower comfort in rain.",
        ],
      },
      {
        type: "heading",
        text: "5) Public Bus Via Dapa",
      },
      {
        type: "paragraph",
        text: "Public transport can be very cheap, but usually requires extra steps and is less convenient when you are just arriving with bags.",
      },
      {
        type: "list",
        items: [
          "Dapa to General Luna bus fares are often around PHP 33.",
          "You still need to get from airport to Dapa first.",
          "Best for: ultra-budget travelers with flexible schedules and very light luggage.",
        ],
      },
      {
        type: "heading",
        text: "Travel Times By Drop-Off Area",
      },
      {
        type: "list",
        items: [
          "IAO Airport to General Luna: around 45 to 60 minutes.",
          "IAO Airport to Catangnan: around 50 minutes.",
          "IAO Airport to Malinao: around 40 minutes.",
          "IAO Airport to Santa Fe: around 25 to 30 minutes.",
          "IAO Airport to Libertad: around 30 to 35 minutes.",
        ],
      },
      {
        type: "paragraph",
        text: "Road conditions are usually straightforward, but timing can stretch during heavy rain, clustered flight arrivals, and peak travel windows.",
      },
      {
        type: "heading",
        text: "Shared Vs Private: Side-By-Side Comparison",
      },
      {
        type: "table",
        headers: ["Option", "Typical Time", "Typical Cost", "Best For", "Main Tradeoff"],
        rows: [
          [
            "Shared Van",
            "45 to 60 min",
            "PHP 300 per person",
            "Budget travelers",
            "Possible wait and multiple stops",
          ],
          [
            "Private Van",
            "45 to 60 min",
            "PHP 2,500 to PHP 3,000 total",
            "Families, groups, luggage-heavy trips",
            "Higher upfront cost",
          ],
          [
            "Tricycle",
            "45 to 60 min",
            "PHP 400 to PHP 600 total (can vary)",
            "Light luggage, small group",
            "Lower comfort for longer route",
          ],
          [
            "Habal-Habal",
            "Around 1 hour or more",
            "PHP 300 to PHP 400 per bike",
            "Light solo riders",
            "Minimal luggage capacity",
          ],
          [
            "Bus via Dapa",
            "Varies with transfers",
            "Around PHP 33 (Dapa to GL leg)",
            "Ultra-budget with flexible time",
            "Not direct from airport",
          ],
        ],
      },
      {
        type: "heading",
        text: "Who Should Choose Private Transfer",
      },
      {
        type: "list",
        items: [
          "Families with children who need a smoother arrival.",
          "Groups carrying surfboards or heavier luggage.",
          "Travelers landing late and wanting direct hotel transfer.",
          "First-time visitors who prefer simple, predictable routing.",
        ],
      },
      {
        type: "paragraph",
        text: "If this sounds like your trip style, a private airport transfer can save energy on day one. Keep it simple: send your flight details, destination, passenger count, and luggage notes so your provider can confirm the right setup.",
      },
      {
        type: "heading",
        text: "Common Mistakes To Avoid",
      },
      {
        type: "list",
        items: [
          "Arriving without enough cash for transfer and small fees.",
          "Not pre-booking in peak season, then waiting too long at arrivals.",
          "Not confirming luggage or surfboard handling before payment.",
          "Accepting unclear pricing without asking for total all-in fare.",
          "Choosing public transport with tight check-in or activity schedules.",
        ],
      },
      {
        type: "heading",
        text: "What To Ask Before You Confirm Any Booking",
      },
      {
        type: "list",
        items: [
          "What is the final total fare and what is included?",
          "Do you track flight delays and how do you handle late arrivals?",
          "Is there any extra fee for remote drop-off points?",
          "Can you handle surfboards or oversized luggage?",
          "Where exactly is the airport meeting point and who is my contact?",
        ],
      },
    ],
  },
  {
    title: "Siargao Airport Transfer Guide For First-Time Visitors",
    slug: "siargao-airport-transfer-first-timer-guide",
    excerpt:
      "What to expect from IAO arrival to hotel drop-off, including timing, luggage, and useful booking details.",
    category: "Airport Tips",
    tags: ["iao airport", "siargao airport transfer", "arrival guide"],
    publishedAt: "2026-02-23",
    updatedAt: "2026-02-23",
    readingTimeMinutes: 6,
    heroImage: "/blog/placeholders/airport-transfer-guide-hero.png",
    heroImageAlt:
      "PLACEHOLDER: replace with real photo of Siargao airport pickup",
    seoTitle: "Siargao Airport Transfer Guide (IAO Arrival Tips)",
    seoDescription:
      "A clear first-timer guide to Siargao airport transfers, with timing expectations, pickup tips, and smooth arrival planning.",
    atAGlance: [
      "Share flight details early so pickup can adapt to delays.",
      "Send exact accommodation name and area for a smoother drop-off.",
      "Keep first-day plans light after arrival.",
    ],
    relatedSlugs: [
      "siargao-airport-general-luna-transfer-guide",
      "siargao-3-day-itinerary-no-motorbike",
      "family-friendly-siargao-day-routes",
    ],
    content: [
      {
        type: "paragraph",
        text: "Your airport transfer sets the tone for your first day in Siargao. A clear handoff from arrival to accommodation helps you settle in faster and avoid unnecessary stress.",
      },
      {
        type: "heading",
        text: "What To Prepare Before Landing",
      },
      {
        type: "list",
        items: [
          "Flight number and arrival date.",
          "Accommodation name with nearest landmark.",
          "Passenger count and luggage notes.",
        ],
      },
      {
        type: "image",
        src: "/blog/placeholders/airport-transfer-guide-inline-1.png",
        alt: "PLACEHOLDER: replace with real photo of arrival at IAO airport",
        caption:
          "Placeholder image: replace with a real airport arrival or pickup moment.",
      },
      {
        type: "heading",
        text: "How Long Does Transfer Usually Take?",
      },
      {
        type: "paragraph",
        text: "For many guests staying in General Luna, the trip commonly falls within a manageable travel window depending on conditions. Add time during peak traffic and rainy weather.",
      },
      {
        type: "quote",
        text: "Small planning details before arrival can save you the most time later.",
      },
      {
        type: "heading",
        text: "First-Day Tip",
      },
      {
        type: "paragraph",
        text: "If you arrive tired, keep your first afternoon open. A simple check-in, meal, and beach walk often feels better than trying to do too much on arrival day.",
      },
    ],
  },
  {
    title: "A 3-Day Siargao Itinerary Without Renting A Motorbike",
    slug: "siargao-3-day-itinerary-no-motorbike",
    excerpt:
      "A realistic 3-day route for travelers who want a comfortable pace, practical timing, and less planning stress.",
    category: "Itineraries",
    tags: ["siargao itinerary", "3 day siargao", "no motorbike trip"],
    publishedAt: "2026-02-22",
    updatedAt: "2026-02-22",
    readingTimeMinutes: 8,
    heroImage: "/blog/placeholders/siargao-itinerary-hero.webp",
    heroImageAlt:
      "PLACEHOLDER: replace with real photo of scenic Siargao day route",
    seoTitle: "3-Day Siargao Itinerary (No Motorbike Needed)",
    seoDescription:
      "Plan three practical days in Siargao with a relaxed route, realistic travel timing, and useful first-timer tips.",
    atAGlance: [
      "Day 1: easy arrival + General Luna reset day.",
      "Day 2: full island route with flexible stops.",
      "Day 3: lighter pace, food spots, and sunset wrap-up.",
    ],
    relatedSlugs: [
      "siargao-airport-general-luna-transfer-guide",
      "general-luna-food-guide",
      "family-friendly-siargao-day-routes",
    ],
    content: [
      {
        type: "paragraph",
        text: "You do not need to rush Siargao to enjoy it. This 3-day structure is built for travelers who want smooth days with enough room for weather and mood changes.",
      },
      {
        type: "heading",
        text: "Day 1: Settle In Properly",
      },
      {
        type: "list",
        items: [
          "Airport arrival and accommodation check-in.",
          "Late lunch and walk around General Luna.",
          "Early dinner and rest.",
        ],
      },
      {
        type: "heading",
        text: "Day 2: Main Island Day",
      },
      {
        type: "paragraph",
        text: "Use this as your biggest route day. Start earlier, group nearby stops, and avoid squeezing too many distant points into one schedule.",
      },
      {
        type: "image",
        src: "/blog/placeholders/siargao-itinerary-inline-1.webp",
        alt: "PLACEHOLDER: replace with real photo of a Siargao stop on a day route",
        caption:
          "Placeholder image: replace with one of your favorite route stops.",
      },
      {
        type: "heading",
        text: "Day 3: Keep It Light",
      },
      {
        type: "paragraph",
        text: "Use your final day for slower experiences. Coffee spots, a shorter local route, and sunset plans usually work best before departure.",
      },
      {
        type: "quote",
        text: "A calm itinerary beats an overloaded one every time.",
      },
    ],
  },
  {
    title: "General Luna Food Guide: Easy Picks By Time Of Day",
    slug: "general-luna-food-guide",
    excerpt:
      "A simple way to plan where and when to eat in General Luna, so your route and meals flow naturally.",
    category: "Food",
    tags: ["general luna restaurants", "siargao cafes", "siargao food guide"],
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21",
    readingTimeMinutes: 5,
    heroImage: "/blog/placeholders/general-luna-food-hero.jpg",
    heroImageAlt:
      "PLACEHOLDER: replace with real photo of restaurant scene in General Luna",
    seoTitle: "General Luna Food Guide: Where To Eat By Time Of Day",
    seoDescription:
      "A practical General Luna food guide with easy breakfast, lunch, and dinner planning tips for travelers.",
    atAGlance: [
      "Plan meals around your route, not as separate long detours.",
      "Book popular dinner spots early on busy nights.",
      "Keep one backup option nearby in case places are full.",
    ],
    relatedSlugs: [
      "siargao-3-day-itinerary-no-motorbike",
      "siargao-airport-general-luna-transfer-guide",
      "family-friendly-siargao-day-routes",
    ],
    content: [
      {
        type: "paragraph",
        text: "Food plans can make or break your day flow in General Luna. A little structure helps you avoid long waits and keeps your route feeling easy.",
      },
      {
        type: "heading",
        text: "Breakfast Strategy",
      },
      {
        type: "paragraph",
        text: "Pick one area and stay there for your morning block. This reduces time spent jumping between cafes before your first activity.",
      },
      {
        type: "list",
        items: [
          "Choose one reliable breakfast zone.",
          "Avoid far detours before noon.",
          "Carry water and quick snacks for transitions.",
        ],
      },
      {
        type: "image",
        src: "/blog/placeholders/general-luna-food-inline-1.jpg",
        alt: "PLACEHOLDER: replace with real photo of breakfast spot in General Luna",
        caption: "Placeholder image: replace with your own food or cafe photo.",
      },
      {
        type: "heading",
        text: "Dinner Timing",
      },
      {
        type: "paragraph",
        text: "If you have a popular dinner target, reserve ahead where possible. Otherwise, have a nearby alternative so your evening stays relaxed.",
      },
    ],
  },
  {
    title: "Family-Friendly Siargao Day Routes With Less Rushing",
    slug: "family-friendly-siargao-day-routes",
    excerpt:
      "Simple route planning tips for families and mixed-age groups who want smoother pacing around Siargao.",
    category: "Family Trips",
    tags: ["family travel siargao", "siargao day tour", "group travel tips"],
    publishedAt: "2026-02-20",
    updatedAt: "2026-02-20",
    readingTimeMinutes: 6,
    heroImage: "/blog/placeholders/family-siargao-routes-hero.jpg",
    heroImageAlt:
      "PLACEHOLDER: replace with real photo of family-friendly Siargao stop",
    seoTitle: "Family-Friendly Siargao Day Routes (Less Rushing, Better Flow)",
    seoDescription:
      "Plan family-friendly day routes in Siargao with practical pacing, break timing, and logistics tips.",
    atAGlance: [
      "Limit long-distance jumps between stops.",
      "Plan rest and snack windows into the route.",
      "Choose one main highlight and build around it.",
    ],
    relatedSlugs: [
      "siargao-3-day-itinerary-no-motorbike",
      "siargao-airport-general-luna-transfer-guide",
      "siargao-airport-transfer-first-timer-guide",
    ],
    content: [
      {
        type: "paragraph",
        text: "Family route planning in Siargao works best when you prioritize pacing over checklist travel. A flexible day with fewer transfers usually feels better for everyone.",
      },
      {
        type: "heading",
        text: "Build Around One Main Highlight",
      },
      {
        type: "paragraph",
        text: "Choose one big stop and keep the rest as optional add-ons. This gives you room to adjust based on energy, weather, and comfort.",
      },
      {
        type: "list",
        items: [
          "Set one non-negotiable stop.",
          "Add one nearby backup stop.",
          "Keep return timing clear before sunset.",
        ],
      },
      {
        type: "image",
        src: "/blog/placeholders/family-siargao-routes-inline-1.jpg",
        alt: "PLACEHOLDER: replace with real photo of relaxed group travel in Siargao",
        caption:
          "Placeholder image: replace with a real family-friendly route moment.",
      },
      {
        type: "quote",
        text: "In family travel, smooth pacing creates better memories than packed schedules.",
      },
      {
        type: "heading",
        text: "Logistics That Help",
      },
      {
        type: "list",
        items: [
          "Share medical or comfort needs before departure.",
          "Include snack and comfort breaks in your timing.",
          "Keep flexible dinner options near your final stop.",
        ],
      },
    ],
  },
];

const postsBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

export function getAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return postsBySlug.get(slug);
}

export function getLatestBlogPosts(limit = 3): BlogPost[] {
  return getAllBlogPosts().slice(0, limit);
}

export function getRelatedBlogPosts(post: BlogPost, limit = 3): BlogPost[] {
  const relatedFromSlugs = post.relatedSlugs
    .map((slug) => postsBySlug.get(slug))
    .filter((candidate): candidate is BlogPost => Boolean(candidate));

  const fallback = getAllBlogPosts().filter((candidate) => candidate.slug !== post.slug);

  const unique = new Map<string, BlogPost>();

  [...relatedFromSlugs, ...fallback].forEach((candidate) => {
    if (!unique.has(candidate.slug) && candidate.slug !== post.slug) {
      unique.set(candidate.slug, candidate);
    }
  });

  return Array.from(unique.values()).slice(0, limit);
}

export function getBlogPostPath(slug: string): string {
  return `/blog/${slug}`;
}

export function formatBlogDate(dateString: string): string {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getBlogHeadingId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}


