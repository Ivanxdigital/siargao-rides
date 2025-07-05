import { Metadata } from "next"
import { notFound } from "next/navigation"
import BlogTemplate from "@/components/blog/BlogTemplate"
import { generateFAQSchema, generateJSONLD } from "@/lib/structured-data"

// Guide content data
const guides = {
  "how-to-find-motorbike-rental-siargao": {
    title: "How to Find a Motorbike Rental in Siargao 2025",
    category: "Transportation Guide",
    readTime: "4 min",
    publishDate: "January 15, 2025",
    excerpt: "Skip the hassle of hunting for motorbike rentals in Siargao. Here's the easiest way to find reliable scooters and bikes, avoid tourist traps, and get the best deals on the island.",
    heroImage: "/images/siargao-motorbike-rental-siargao.png",
    content: `
      So you're heading to Siargao and need a bike to get around? Smart move. The island is way too beautiful to be stuck walking or waiting for tricycles. But here's the thing – finding a decent motorbike rental in Siargao can be a total headache if you don't know where to look.

      Picture this all-too-common scenario:

      <figure>
        <img src="/images/confused-tourist.png" alt="Tourist looking confused at multiple motorbike rental shops in Siargao" />
        <figcaption>The classic rental shop confusion – you've probably been here before</figcaption>
      </figure>

      Don't be this tourist. Let me save you hours of walking around General Luna comparing prices and dealing with sketchy operators. Here's exactly how to find a reliable motorbike rental without the stress.

      ## The Smart Way to Find Your Ride

      **Skip the Shop-Hopping Marathon**

      Instead of wandering around General Luna with your luggage asking "do you have bikes?" at every corner, **use Siargao Rides first**. It's basically the island's rental comparison site where you can:

      - See what's actually available before you walk anywhere
      - Compare real prices from verified shops
      - Read reviews from people who actually rented the bikes
      - Book online and arrange pickup at your hotel

      <!-- Image placeholder: Screenshot of Siargao Rides website showing bike listings -->

      **Why This Beats the Old School Method**

      Look, I get it. Some people love the "authentic" experience of haggling with local shops. But when you're tired from traveling and just want to start exploring, spending half your first day comparing identical Honda Beats isn't exactly fun.

      Plus, during peak season (December-March), the good bikes get snatched up fast. Having a confirmed booking beats showing up to empty lots.

      ## What You'll Actually Pay

      Let's be real about pricing. Don't believe anyone who promises "cheap" rentals – here's what things actually cost in 2025:

      **Basic Scooters (Honda Beat, Yamaha Mio)**
      - ₱400-500/day for short rentals
      - ₱350-400/day for week+ rentals
      - Perfect for beginners and beach hopping

      **Automatic Motorcycles (Click 150, NMAX)**
      - ₱600-800/day
      - More comfortable for longer rides
      - Better for couples or taller riders

      <!-- Image placeholder: Side-by-side comparison of Honda Beat vs NMAX -->

      **Manual Bikes (XRM, XR150)**
      - ₱700-1,000/day
      - Only if you actually know how to ride manual
      - Good for off-road adventures

      **The Hidden Costs Nobody Mentions**
      - Fuel: ₱100-150/day (gas isn't cheap here)
      - Deposit: ₱3,000-8,000 (get this back if you don't crash)
      - Helmet upgrade: ₱50/day (trust me, get a better one)

      ## Red Flags to Avoid

      **Hotel "Partnerships"**
      If your hotel offers to arrange a rental for ₱800/day, they're probably marking it up ₱200-300. Thanks, but no thanks.

      **Facebook Marketplace Randos**
      That guy messaging you with "best price bro" and no shop address? Hard pass. You want someone you can find if something goes wrong.

      **Bikes That Look Sketchy**
      - Worn tires that look like racing slicks
      - Lights that don't work (you'll get stopped by police)
      - No registration papers
      - More rust than paint

      <!-- Image placeholder: Split image of well-maintained bike vs sketchy rental bike -->

      ## The Booking Process (Actually Simple)

      **Step 1: Check What's Available**
      Hit up Siargao Rides the day before you arrive (or earlier during peak season). Filter by your budget and pickup location.

      **Step 2: Book and Confirm**
      Pay the deposit online. Get a confirmation with pickup details. Done.

      **Step 3: Pickup and Inspect**
      Meet at the agreed spot (your hotel, the shop, wherever). Test the brakes, lights, and horn. Take photos of any scratches. Sign the papers.

      **Step 4: Ride Off Into Paradise**
      You've got wheels. Go explore those hidden beaches and lagoons.

      <!-- Image placeholder: Happy tourist riding off on scooter with surfboard -->

      ## Quick Safety Reality Check

      Look, I'm not going to lecture you about wearing full protective gear in tropical heat. But here are the non-negotiable basics:

      **Always Wear a Helmet**
      The police will fine you ₱1,000+ if caught without one. More importantly, Siargao's roads have some surprises (potholes, chickens, drunk tourists).

      **Drive Defensively**
      Everyone's on vacation mode, which means lots of unpredictable driving. Give yourself extra space.

      **Know Your Limits**
      Never ridden a motorbike? Start with an automatic scooter and practice in quiet areas. Manual bikes on dirt roads aren't the place to learn.

      <!-- Image placeholder: Rider wearing helmet on scenic coastal road -->

      ## Where to Actually Rent

      **General Luna** has the most options and competitive prices. This is rental central.

      **Cloud 9** works if you're staying beachside, but expect to pay ₱100-200 more per day for convenience.

      **Dapa Port** has a few shops if you need wheels immediately off the ferry, but selection is limited.

      Honestly though, if you're using **Siargao Rides**, location matters less since they can arrange pickup wherever you're staying.

      ## Pro Tips From Someone Who's Done This

      - Book 2-3 days ahead during peak season (December-March)
      - Weekly rentals get you better daily rates
      - Always take photos of existing damage before you leave
      - Keep the rental agreement and emergency contact in your phone
      - Fill up with gas before returning (unless told otherwise)

      <!-- Image placeholder: Tourist taking photos of bike condition with phone -->

      ## Why Siargao Rides Just Makes Sense

      After trying the "walk around and compare" method on my first trip (waste of time), using **Siargao Rides** on my second visit was a game-changer:

      ✅ **All verified shops** – no sketchy operators
      ✅ **Real pricing** – no surprise fees or commission markups  
      ✅ **Actual reviews** – from real customers, not fake ones
      ✅ **Easy booking** – reserve from your hotel/airport
      ✅ **Local support** – actual help when you need it

      Stop stressing about transportation and start planning which beach to hit first. Browse verified rental shops on Siargao Rides and get your perfect ride sorted before you even land.
    `,
    faqs: [
      {
        question: "How much does it actually cost to rent a motorbike in Siargao?",
        answer: "Basic scooters like Honda Beat run ₱400-500/day for short rentals, or ₱350-400/day if you rent for a week+. Automatic bikes (NMAX, Click) are ₱600-800/day. Don't forget fuel (₱100-150/day) and deposits (₱3,000-8,000)."
      },
      {
        question: "Can I just show up and find a bike, or do I need to book ahead?",
        answer: "You can usually find something if you show up, but during peak season (December-March) the good bikes get taken fast. Book 2-3 days ahead to guarantee you get what you want at a fair price, not whatever's left over."
      },
      {
        question: "Do I really need a motorcycle license to rent in Siargao?",
        answer: "Officially yes, you need a valid license and international permit. In reality, enforcement varies - some shops accept any license, others are strict. Play it safe with proper documents to avoid hassles with police or insurance issues."
      },
      {
        question: "Is Siargao Rides actually better than just walking around comparing shops?",
        answer: "If you enjoy spending your vacation time shop-hopping and haggling, go for it. But Siargao Rides lets you compare verified shops, see real prices, and book from your hotel. Most people prefer to spend that time at the beach instead."
      },
      {
        question: "What happens if I crash or the bike breaks down?",
        answer: "Contact your rental shop immediately - keep their number saved in your phone. Good shops provide roadside help or replacement bikes. This is why booking through verified operators matters - you want someone reliable when things go wrong."
      }
    ],
    relatedPosts: [
      {
        title: "Where to Rent a Motorbike in Siargao",
        slug: "where-to-rent-motorbike-siargao",
        category: "Locations",
        excerpt: "Discover the best rental locations in General Luna, Cloud 9, and other areas of Siargao Island.",
        readTime: "4 min",
        image: "/images/michael-louie-8bqoFf_Q1xw-unsplash.jpg"
      },
      {
        title: "Most Popular Vehicles in Siargao",
        slug: "popular-vehicles-ride-siargao",
        category: "Vehicle Types",
        excerpt: "From scooters to motorcycles - explore the most popular vehicle options for Siargao exploration.",
        readTime: "6 min",
        image: "/images/alejandro-luengo-clllGLYtLRA-unsplash.jpg"
      }
    ]
  },
  "where-to-rent-motorbike-siargao": {
    title: "Where to Rent a Motorbike in Siargao",
    category: "Location Guide",
    readTime: "4 min",
    publishDate: "January 16, 2025",
    excerpt: "Discover the best locations and rental shops in General Luna, Cloud 9, and other areas of Siargao Island for reliable motorbike rentals.",
    heroImage: "/images/michael-louie-8bqoFf_Q1xw-unsplash.jpg",
    content: `
      Knowing where to rent a motorbike in Siargao can save you time, money, and hassle. Different areas offer different advantages, from competitive pricing to convenient pickup locations. Here's your complete guide to the best rental locations across the island.

      ## General Luna - The Rental Hub

      **Why Choose General Luna?**
      
      General Luna is the heart of Siargao's rental scene, offering the highest concentration of verified shops and most competitive prices. This tourist-friendly town makes it easy to compare options and find the perfect ride.

      **Top Rental Areas in General Luna:**
      
      ### Main Road (Tourism Road)
      - **Highest concentration** of rental shops
      - **Easy comparison shopping** - walk between shops
      - **Competitive pricing** due to competition
      - **English-speaking staff** at most locations
      - **24/7 emergency support** from multiple shops

      ### Beach Road
      - **Convenient for surfers** staying near Cloud 9
      - **Higher prices** but worth it for location
      - **Quick beach access** for testing rides
      - **Limited selection** compared to main road

      ### Town Center
      - **Budget-friendly options** available
      - **Local shops** with authentic experience
      - **Cash-only payments** common
      - **Basic English** at some locations

      **Recommended Shops in General Luna:**
      Browse verified shops on **Siargao Rides** to find:
      - Island Cycle Rentals - Premium vehicles, excellent service
      - Siargao Bike Hub - Budget-friendly options, reliable
      - Tropical Rides - Wide selection, competitive rates
      - Local Motorbike Center - Authentic experience, good prices

      ## Cloud 9 - Surfer's Paradise

      **Perfect for Wave Riders**
      
      If you're staying near Cloud 9 and primarily surfing, renting locally saves you the trip to General Luna. However, options are more limited and prices slightly higher.

      **What to Expect in Cloud 9:**
      - **Limited shop selection** (3-4 main options)
      - **Premium pricing** (10-20% higher than General Luna)
      - **Surf-focused service** - shops understand surfer needs
      - **Board racks available** on some rentals
      - **Quick beach access** for dawn patrol sessions

      **Cloud 9 Rental Tips:**
      - Book in advance during peak surf season
      - Compare with General Luna prices if you don't mind the ride
      - Ask about surfboard carrying equipment
      - Confirm pickup/drop-off locations

      ## Dapa Port - Arrival Convenience

      **First Stop Off the Ferry**
      
      Dapa Port offers immediate transportation solutions for travelers arriving by ferry, but with limited selection and higher prices.

      **Dapa Rental Characteristics:**
      - **Immediate availability** upon ferry arrival
      - **Convenience fee** reflected in pricing
      - **Limited vehicle selection** (mostly basic scooters)
      - **Transportation to accommodation** included by some shops
      - **Higher daily rates** but may include delivery

      **Best Strategy for Dapa:**
      1. **Book online in advance** through Siargao Rides
      2. **Arrange pickup** at your accommodation in General Luna
      3. **Save money** and get better vehicle selection
      4. **Use van transfer** from port to accommodation first

      ## Other Island Locations

      ### Pacifico (Burgos)
      - **Very limited options** - mostly through accommodations
      - **Premium pricing** due to remote location  
      - **Basic scooters only** - no motorcycles or cars
      - **Cash payments required**

      ### Del Carmen
      - **Local shops only** - limited English
      - **Competitive local pricing** but harder to verify quality
      - **Basic vehicles** with minimal insurance coverage
      - **Not recommended** for tourists

      ### Santa Monica
      - **Few rental options** available
      - **Higher prices** than General Luna
      - **Limited vehicle selection**
      - **Better to rent in General Luna** and ride over

      ## Rental Location Comparison

      | Location | Price Range | Selection | Convenience | Quality |
      |----------|-------------|-----------|-------------|---------|
      | General Luna | ₱350-800/day | Excellent | High | Verified |
      | Cloud 9 | ₱400-900/day | Good | High | Good |
      | Dapa Port | ₱500-1000/day | Limited | Very High | Variable |
      | Pacifico | ₱600-1200/day | Very Limited | Medium | Basic |

      ## Airport Pickup Services

      **Sayak Airport to Your Location**
      
      While there are no rental counters at Sayak Airport, many shops offer pickup services:

      **How Airport Pickup Works:**
      1. **Book online** in advance through verified platforms
      2. **Provide flight details** for pickup timing
      3. **Meet at designated area** outside terminal
      4. **Complete paperwork** and vehicle inspection
      5. **Pay balance** and receive keys

      **Airport Pickup Fees:**
      - **General Luna shops:** ₱200-500 pickup fee
      - **Cloud 9 shops:** ₱300-600 pickup fee
      - **Premium services:** ₱500-1000 (includes vehicle delivery)

      ## Best Booking Strategy

      ### For First-Time Visitors
      1. **Use Siargao Rides** to compare verified options
      2. **Book 2-3 days in advance** for best selection
      3. **Choose General Luna pickup** for competitive rates
      4. **Select shops with English support** and good reviews

      ### For Experienced Travelers
      1. **Direct contact** with preferred shops from previous visits
      2. **Negotiate weekly/monthly rates** for longer stays
      3. **Consider local shops** for authentic experience
      4. **Build relationships** for future trip discounts

      ### For Surfers
      1. **Cloud 9 pickup** if staying beachside
      2. **Request surfboard racks** during booking
      3. **Confirm early morning availability** for dawn patrol
      4. **Ask about board damage policies**

      ## Red Flags to Avoid

      **Sketchy Locations:**
      - **Unmarked stalls** along roads without fixed addresses
      - **Hotel front desk "deals"** with unclear terms
      - **Random Facebook contacts** without verifiable shop locations
      - **Airport touts** offering "special deals"

      **Warning Signs:**
      - **No physical shop** to visit and verify
      - **Cash-only deposits** exceeding ₱10,000
      - **Vague pickup/return policies**
      - **No emergency contact numbers**
      - **Reluctance to show insurance papers**

      ## Why Location Matters

      **Convenience vs. Cost:**
      The right rental location depends on your priorities:

      **Choose General Luna if you want:**
      ✅ Best prices and selection  
      ✅ Easy comparison shopping  
      ✅ Verified, reliable shops  
      ✅ English-speaking support  
      ✅ 24/7 emergency assistance  

      **Choose Cloud 9 if you want:**
      ✅ Surf-focused convenience  
      ✅ Immediate beach access  
      ✅ Premium service level  
      ✅ No travel to town required  

      **Choose Airport Pickup if you want:**
      ✅ Immediate transportation  
      ✅ No van transfer needed  
      ✅ Straight to accommodation  
      ✅ Maximum convenience  

      ## Pro Tips for Any Location

      **Before You Book:**
      - **Compare prices** across multiple locations and shops
      - **Read recent reviews** to verify current service quality
      - **Confirm pickup details** and any additional fees
      - **Ask about insurance coverage** and damage policies

      **During Pickup:**
      - **Inspect thoroughly** regardless of shop reputation
      - **Test all functions** before leaving the shop
      - **Take photos** of any existing damage
      - **Keep rental agreement** and emergency contacts handy

      **For Return:**
      - **Return with agreed fuel level** to avoid charges
      - **Allow extra time** for inspection process
      - **Get written confirmation** of successful return
      - **Check deposit refund** before leaving

      Ready to find the perfect rental location? **Siargao Rides** makes it easy to compare verified shops across all major locations in Siargao, ensuring you get the best deal with reliable service wherever you choose to rent.
    `,
    faqs: [
      {
        question: "Which location has the cheapest motorbike rentals in Siargao?",
        answer: "General Luna offers the most competitive prices due to high competition among rental shops. You can find basic scooters starting from ₱350/day, compared to ₱400-500/day in other locations like Cloud 9 or Dapa."
      },
      {
        question: "Can I rent a motorbike directly at Sayak Airport?",
        answer: "There are no rental counters at Sayak Airport, but many shops offer pickup services. It's better to book online in advance and arrange pickup at your accommodation for better rates and selection."
      },
      {
        question: "Is it worth renting in Cloud 9 instead of General Luna?",
        answer: "If you're staying near Cloud 9 and primarily surfing, the convenience may justify the 10-20% higher cost. However, General Luna offers better selection and prices if you don't mind the short ride."
      },
      {
        question: "Which areas should I avoid for motorbike rentals?",
        answer: "Avoid unmarked roadside stalls, random social media contacts without physical shop locations, and deals that seem too good to be true. Stick to verified shops in main areas like General Luna or Cloud 9."
      }
    ],
    relatedPosts: [
      {
        title: "How to Find a Motorbike Rental in Siargao",
        slug: "how-to-find-motorbike-rental-siargao",
        category: "Transportation",
        excerpt: "Complete guide to finding reliable motorbike rentals in Siargao Island.",
        readTime: "5 min",
        image: "/images/siargao-motorbike-rental-siargao.png"
      },
      {
        title: "Motorbike Rental Prices in Siargao 2025",
        slug: "motorbike-rental-prices-siargao",
        category: "Pricing",
        excerpt: "Current pricing guide for motorcycle and scooter rentals in Siargao.",
        readTime: "4 min",
        image: "/images/pexels-roamingmary-15931909.jpg"
      }
    ]
  },
  "popular-vehicles-ride-siargao": {
    title: "Most Popular Vehicles to Ride Around Siargao",
    category: "Vehicle Guide",
    readTime: "6 min",
    publishDate: "January 17, 2025",
    excerpt: "From scooters to motorcycles and cars - explore the most popular vehicle options for getting around Siargao Island and find your perfect ride.",
    heroImage: "/images/alejandro-luengo-clllGLYtLRA-unsplash.jpg",
    content: `
      Choosing the right vehicle for your Siargao adventure depends on your experience level, intended destinations, and riding comfort preferences. Here's a comprehensive guide to the most popular vehicles on the island and which one might be perfect for your trip.

      ## Automatic Scooters - The Tourist Favorite

      **Honda Beat 150 - The Island Standard**
      
      The Honda Beat is Siargao's most popular rental choice, and for good reason. This automatic scooter offers the perfect balance of ease, reliability, and affordability.

      **Why Choose Honda Beat:**
      ✅ **Fully automatic** - no clutch or gear shifting required  
      ✅ **Fuel efficient** - up to 40km per liter  
      ✅ **Easy to handle** - perfect for beginners  
      ✅ **Under-seat storage** for small items  
      ✅ **Affordable** - ₱350-500/day  
      ✅ **Available everywhere** - easy to find parts/service  

      **Best For:**
      - First-time riders in the Philippines
      - Short to medium distance trips (under 30km)
      - Couples sharing a ride
      - Budget-conscious travelers
      - City and paved road riding

      **Limitations:**
      - Limited power for steep hills
      - Not suitable for off-road adventures
      - Small storage capacity
      - Less comfortable for tall riders

      **Yamaha Mio - The Reliable Alternative**
      
      Similar to Honda Beat but with slightly different styling and features. Equally popular among tourists and locals.

      **Key Features:**
      - Automatic transmission
      - Good fuel economy
      - Reliable performance
      - Comfortable seating
      - Price range: ₱380-520/day

      ## Premium Automatic Scooters

      **Yamaha NMAX 155 - The Upgrade**
      
      For those wanting more power and comfort while maintaining automatic convenience, the NMAX is the perfect step up.

      **NMAX Advantages:**
      ✅ **More powerful engine** - better for hills and highway speeds  
      ✅ **Larger wheels** - improved stability and comfort  
      ✅ **Better suspension** - smoother ride quality  
      ✅ **More storage space** - larger under-seat compartment  
      ✅ **Premium features** - digital dashboard, better brakes  
      ✅ **Comfortable for two** - spacious seating  

      **Pricing:** ₱600-800/day
      **Best For:**
      - Experienced scooter riders
      - Longer distance touring
      - Two-up riding comfort
      - Highway travel to other parts of the island

      **Honda Click 150i - The Balanced Choice**
      
      Honda's premium scooter offering combines reliability with modern features.

      **Click 150i Features:**
      - Powerful 150cc engine
      - Advanced braking system
      - Spacious storage
      - Comfortable ergonomics
      - Price range: ₱550-750/day

      ## Manual Motorcycles - For the Experienced

      **Honda XRM 125 - The Adventure Bike**
      
      Perfect for riders who want to explore Siargao's more remote and challenging terrain.

      **XRM 125 Benefits:**
      ✅ **Manual transmission** - full control over power delivery  
      ✅ **Higher ground clearance** - suitable for rough roads  
      ✅ **Durable construction** - built for Philippine conditions  
      ✅ **Good for off-road** - can handle dirt roads and trails  
      ✅ **Fuel efficient** - despite manual transmission  
      ✅ **Local favorite** - parts and service readily available  

      **Pricing:** ₱700-900/day
      **Best For:**
      - Experienced motorcycle riders
      - Off-road and adventure touring
      - Reaching remote beaches and hidden spots
      - Riders who prefer manual control

      **Requirements:**
      - Manual motorcycle experience
      - Valid motorcycle license
      - Comfort with clutch and gear shifting

      **Kawasaki Fury 125 - The Sporty Option**
      
      A more aggressive styling with manual transmission for sport-oriented riders.

      **Fury 125 Features:**
      - Sporty design and seating position
      - Manual 5-speed transmission
      - Good power-to-weight ratio
      - Price range: ₱750-950/day

      ## Cars - For Comfort and Groups

      **Toyota Vios - The Family Choice**
      
      The most popular car rental option for families, groups, or those preferring air-conditioned comfort.

      **Vios Advantages:**
      ✅ **Air conditioning** - escape the tropical heat  
      ✅ **Seats 4-5 people** - perfect for groups  
      ✅ **Large trunk space** - room for luggage and gear  
      ✅ **Weather protection** - safe from rain and sun  
      ✅ **Comfortable interiors** - relaxed travel experience  
      ✅ **Reliable performance** - well-maintained fleet vehicles  

      **Pricing:** ₱2,500-3,500/day
      **Best For:**
      - Families with children
      - Groups of 3+ people
      - Travelers with lots of luggage
      - Rainy season visits
      - Longer distance touring

      **Mitsubishi Mirage - The Budget Car**
      
      Smaller and more affordable car option for budget-conscious groups.

      **Mirage Features:**
      - Compact size, easy to park
      - Good fuel economy
      - Air conditioning
      - Seats 4 people comfortably
      - Price range: ₱2,200-3,000/day

      **Toyota Innova - The Group Hauler**
      
      For larger groups or families needing maximum space and comfort.

      **Innova Benefits:**
      - Seats up to 8 people
      - Large cargo capacity
      - High driving position
      - Excellent for airport transfers
      - Price range: ₱4,000-5,500/day

      ## Electric Vehicles - The Future

      **Electric Scooters - Eco-Friendly Option**
      
      A growing trend in Siargao with several shops now offering electric scooters.

      **Electric Scooter Benefits:**
      ✅ **Zero emissions** - environmentally friendly  
      ✅ **Silent operation** - peaceful riding experience  
      ✅ **Low operating cost** - electricity cheaper than gasoline  
      ✅ **Instant torque** - quick acceleration  
      ✅ **Unique experience** - try something different  

      **Considerations:**
      - Limited range (50-80km per charge)
      - Charging infrastructure still developing
      - Higher rental rates (₱800-1,200/day)
      - Weather sensitivity for charging

      ## Vehicle Comparison by Use Case

      ### Beach Hopping & Short Trips
      **Best Choice:** Honda Beat or Yamaha Mio
      - Easy to ride and park
      - Fuel efficient for multiple stops
      - Affordable for daily use

      ### Island Touring & Long Distances
      **Best Choice:** Yamaha NMAX or Honda Click 150i
      - More comfort for extended riding
      - Better power for highway speeds
      - Improved storage capacity

      ### Adventure & Off-Road Exploration
      **Best Choice:** Honda XRM 125 or similar manual bike
      - Higher ground clearance
      - Manual control for challenging terrain
      - Durable construction

      ### Group Travel & Families
      **Best Choice:** Toyota Vios or Mitsubishi Mirage
      - Air-conditioned comfort
      - Space for multiple passengers
      - Weather protection

      ### Airport Transfers & Heavy Luggage
      **Best Choice:** Toyota Innova or van service
      - Maximum passenger and cargo capacity
      - Comfortable for longer transfers
      - Professional driver available

      ## Seasonal Considerations

      **Dry Season (November - April):**
      - Any vehicle type suitable
      - Perfect weather for motorcycles and scooters
      - Consider open-air vehicles for best experience

      **Wet Season (May - October):**
      - Cars recommended for frequent rain
      - If choosing motorcycles, ensure good rain gear
      - Consider covered storage at accommodations

      ## Price Comparison Summary

      | Vehicle Type | Daily Rate | Best For | Experience Required |
      |-------------|------------|----------|-------------------|
      | Honda Beat | ₱350-500 | Beginners, short trips | None |
      | Yamaha Mio | ₱380-520 | City riding, couples | Basic |
      | NMAX 155 | ₱600-800 | Touring, comfort | Intermediate |
      | Click 150i | ₱550-750 | Balanced performance | Intermediate |
      | XRM 125 | ₱700-900 | Adventure, off-road | Advanced |
      | Electric Scooter | ₱800-1,200 | Eco-friendly, unique | Basic |
      | Toyota Vios | ₱2,500-3,500 | Groups, families | Car license |
      | Mitsubishi Mirage | ₱2,200-3,000 | Budget groups | Car license |
      | Toyota Innova | ₱4,000-5,500 | Large groups | Car license |

      ## Making Your Choice

      **Consider These Factors:**
      1. **Riding experience** - Don't overestimate your skills
      2. **Trip duration** - Longer trips need more comfort
      3. **Number of passengers** - Choose appropriate capacity
      4. **Destinations planned** - Match vehicle to terrain
      5. **Budget constraints** - Balance cost with features needed
      6. **Weather forecast** - Plan for seasonal conditions

      **Pro Tips:**
      - **Test ride** before committing to longer rentals
      - **Ask for demonstrations** of any unfamiliar features
      - **Consider upgrade costs** vs. comfort benefits
      - **Factor in fuel costs** when comparing prices
      - **Check insurance coverage** for your chosen vehicle type

      Ready to find your perfect ride? **Siargao Rides** offers all these popular vehicle types from verified rental shops, making it easy to compare options and book the ideal vehicle for your Siargao adventure.
    `,
    faqs: [
      {
        question: "What's the best vehicle for a beginner rider in Siargao?",
        answer: "The Honda Beat 150 is perfect for beginners. It's fully automatic, easy to handle, fuel efficient, and available everywhere on the island. Most rental shops provide basic training if you've never ridden before."
      },
      {
        question: "Do I need experience to ride a manual motorcycle in Siargao?",
        answer: "Yes, manual motorcycles like the Honda XRM 125 require prior experience with clutch and gear shifting. The terrain can be challenging, so only experienced riders should choose manual bikes."
      },
      {
        question: "Is it worth renting a car instead of a motorbike in Siargao?",
        answer: "Cars are worth it for families, groups of 3+ people, heavy luggage, or during rainy season. However, motorbikes offer more flexibility for parking, narrow roads, and experiencing the island's natural beauty."
      },
      {
        question: "What's the most fuel-efficient vehicle option in Siargao?",
        answer: "Basic scooters like Honda Beat and Yamaha Mio offer the best fuel economy at around 40km per liter. Electric scooters are even more economical to operate, though charging infrastructure is still developing."
      },
      {
        question: "Can I switch vehicle types during my stay in Siargao?",
        answer: "Most rental shops allow vehicle changes, but you'll pay separately for each rental period. It's better to choose the right vehicle from the start or book longer-term with shops that offer flexibility."
      }
    ],
    relatedPosts: [
      {
        title: "How to Find a Motorbike Rental in Siargao",
        slug: "how-to-find-motorbike-rental-siargao",
        category: "Transportation",
        excerpt: "Complete guide to finding reliable motorbike rentals in Siargao Island.",
        readTime: "5 min",
        image: "/images/siargao-motorbike-rental-siargao.png"
      },
      {
        title: "Motorbike Rental Prices in Siargao 2025",
        slug: "motorbike-rental-prices-siargao",
        category: "Pricing",
        excerpt: "Current pricing guide for motorcycle and scooter rentals in Siargao.",
        readTime: "4 min",
        image: "/images/pexels-roamingmary-15931909.jpg"
      }
    ]
  }
}

interface GuidePageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const resolvedParams = await params
  const guide = guides[resolvedParams.slug as keyof typeof guides]
  
  if (!guide) {
    return {
      title: "Guide Not Found | Siargao Rides",
      description: "The requested guide could not be found."
    }
  }

  return {
    title: `${guide.title} | Siargao Rides`,
    description: guide.excerpt,
    keywords: [
      "Siargao motorbike rental",
      "motorcycle rental Siargao", 
      "scooter rental Siargao",
      "vehicle rental Siargao",
      "Siargao transportation guide",
      "rent motorbike Siargao",
      "Siargao travel guide"
    ],
    openGraph: {
      title: `${guide.title} | Siargao Rides`,
      description: guide.excerpt,
      type: "article",
      publishedTime: guide.publishDate,
      images: [
        {
          url: guide.heroImage,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.title} | Siargao Rides`,
      description: guide.excerpt,
      images: [guide.heroImage],
    },
    alternates: {
      canonical: `https://siargaorides.ph/guides/${resolvedParams.slug}`,
    },
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const resolvedParams = await params
  const guide = guides[resolvedParams.slug as keyof typeof guides]
  
  if (!guide) {
    notFound()
  }

  // Generate FAQ schema for this guide
  const faqSchema = guide.faqs.length > 0 ? generateFAQSchema(guide.faqs) : null

  // Generate Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.excerpt,
    "image": guide.heroImage,
    "author": {
      "@type": "Organization",
      "name": "Siargao Rides"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Siargao Rides",
      "logo": {
        "@type": "ImageObject",
        "url": "https://siargaorides.ph/logo.png"
      }
    },
    "datePublished": guide.publishDate,
    "dateModified": guide.publishDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://siargaorides.ph/guides/${resolvedParams.slug}`
    }
  }


  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(articleSchema)
        }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(faqSchema)
          }}
        />
      )}
      
      <BlogTemplate
        title={guide.title}
        category={guide.category}
        readTime={guide.readTime}
        publishDate={guide.publishDate}
        excerpt={guide.excerpt}
        heroImage={guide.heroImage}
        content={guide.content}
        faqs={guide.faqs}
        relatedPosts={guide.relatedPosts}
      />
    </>
  )
}

// Generate static params for all guide pages
export async function generateStaticParams() {
  return Object.keys(guides).map((slug) => ({
    slug,
  }))
}