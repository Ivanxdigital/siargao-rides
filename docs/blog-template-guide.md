# Blog Template System Documentation

## Overview

The Siargao Rides blog template system is designed to create high-value, SEO-optimized content that targets high-intent search terms while naturally promoting the Siargao Rides platform. The system provides a reusable template structure for creating informational guides about vehicle rentals in Siargao.

## System Architecture

### File Structure
```
src/
├── components/blog/
│   └── BlogTemplate.tsx          # Reusable blog post template
├── app/guides/
│   ├── page.tsx                  # Guides index/landing page
│   └── [slug]/
│       └── page.tsx              # Dynamic guide pages with content
└── app/sitemap.ts                # Updated to include guide pages
```

### Key Features
- **Reusable Template**: Single component handles all blog post layouts
- **SEO Optimized**: Built-in metadata, structured data, and schema markup
- **Mobile Responsive**: Matches existing Siargao Rides design system
- **Cross-linking**: Automatic related posts and strategic CTAs
- **Performance**: Static generation with Next.js for fast loading

## Creating New Blog Posts

### Step 1: Choose Your Target Keywords

Before creating content, identify the search terms you want to rank for:
- Use tools like Google Keyword Planner or Answer the Public
- Focus on high-intent keywords (people ready to book rentals)
- Target location-specific terms (e.g., "siargao", "general luna")
- Consider user questions (e.g., "how to", "where to", "best")

### Step 2: Plan Your Content Strategy

Each guide should follow the **70/30 rule**:
- **70% genuine value**: Solving real user problems with actionable advice
- **30% natural promotion**: Positioning Siargao Rides as the solution

### Step 3: Add Guide to System

1. **Update the guide list** in `/src/app/guides/[slug]/page.tsx`
2. **Add to sitemap** in `/src/app/sitemap.ts` 
3. **Update guides index** in `/src/app/guides/page.tsx`

## Content Structure Template

### Required Guide Object Properties
```typescript
{
  title: string              // SEO-optimized title (50-60 characters)
  category: string          // Category badge (e.g., "Transportation Guide")
  readTime: string          // Estimated reading time (e.g., "5 min")
  publishDate: string       // Publication date (e.g., "January 15, 2025")
  excerpt: string           // Meta description/summary (150-160 characters)
  heroImage: string         // Header image path (16:9 aspect ratio recommended)
  content: string           // Main article content (markdown-style formatting)
  faqs: FAQ[]              // FAQ section for featured snippets
  relatedPosts: BlogPost[]  // Cross-linking to other guides
}
```

### Content Formatting Guidelines

The content string supports the following formatting:

```markdown
## Main Headings (H2)
### Sub Headings (H3)
**Bold Section Headers**
✅ **Checkmark lists** - for benefits/features
- **Bullet points** - for regular lists
| Tables | Are | Supported |
```

### SEO Best Practices

1. **Title Optimization**:
   - Include primary keyword near the beginning
   - Keep under 60 characters
   - Make it compelling and click-worthy

2. **Content Structure**:
   - Use H2/H3 headings with keywords
   - Include location-specific terms
   - Add comparison tables when relevant
   - Use bullet points for readability

3. **Strategic Mentions**:
   - Mention "Siargao Rides" 3-5 times naturally
   - Include calls-to-action every 800-1000 words
   - Link to browse pages and shop listings

4. **FAQs for Featured Snippets**:
   - Target "People Also Ask" questions
   - Provide concise, actionable answers
   - Include primary keywords in questions

## AI Agent Prompt Template

When instructing an AI coding agent to create a new blog post, use this comprehensive prompt template:

### Basic Prompt Structure

```
I want to create a new blog post for the Siargao Rides blog template system.

TARGET KEYWORDS: [list your target keywords]
POST TITLE: [your SEO-optimized title]
CONTENT FOCUS: [brief description of what the post should cover]

Please:
1. Add the new guide object to the guides constant in `/src/app/guides/[slug]/page.tsx`
2. Add the slug to the guidePages array in `/src/app/sitemap.ts`
3. Update the guides array in `/src/app/guides/page.tsx` if this should be featured

The guide should follow these specifications:
- 1,500-2,500 words of high-value content
- Include 4-6 FAQs targeting "People Also Ask" questions
- Follow the 70/30 rule (70% value, 30% Siargao Rides promotion)
- Include comparison tables/lists where relevant
- Add 2-3 related posts cross-links
- Use Siargao-specific local knowledge and examples
- Target search intent of users ready to book rentals

SLUG: [kebab-case-url-slug]
CATEGORY: [Category Badge Text]
HERO IMAGE: [path to existing image or suggest new one needed]
```

### Example Complete Prompt

```
I want to create a new blog post for the Siargao Rides blog template system.

TARGET KEYWORDS: "motorbike rental prices siargao", "scooter rental cost siargao", "cheapest motorbike rental siargao"
POST TITLE: "Motorbike Rental Prices in Siargao 2025: Complete Pricing Guide"
CONTENT FOCUS: Current pricing for different vehicle types, how to find deals, what affects pricing, and budget tips

Please:
1. Add the new guide object to the guides constant in `/src/app/guides/[slug]/page.tsx`
2. Add "motorbike-rental-prices-siargao" to the guidePages array in `/src/app/sitemap.ts`
3. Update the guides array in `/src/app/guides/page.tsx` to include this as a featured guide

The guide should follow these specifications:
- 2,000+ words covering pricing for all vehicle types (scooters, motorcycles, cars)
- Include pricing comparison tables by location and season
- Cover factors that affect pricing (insurance, duration, vehicle condition)
- Provide money-saving tips and negotiation strategies
- Include 5 FAQs about pricing and payment methods
- Follow the 70/30 rule with natural Siargao Rides mentions
- Add related posts linking to "how-to-find" and "where-to-rent" guides

SLUG: motorbike-rental-prices-siargao
CATEGORY: Pricing Guide
HERO IMAGE: /images/pexels-roamingmary-15931909.jpg
```

## Technical Implementation Notes

### Adding New Guides

1. **Update Guide Object**: Add to the `guides` constant in `/src/app/guides/[slug]/page.tsx`
2. **Update Sitemap**: Add slug to `guidePages` array in `/src/app/sitemap.ts`
3. **Update Index**: Add to `guides` array in `/src/app/guides/page.tsx` if featured

### Image Requirements
- **Hero Images**: 16:9 aspect ratio, minimum 1200x675px
- **Location**: Store in `/public/images/` directory
- **Format**: JPG or PNG, optimized for web
- **Alt Text**: Will be auto-generated from guide title

### URL Structure
- **Guides Index**: `/guides`
- **Individual Guides**: `/guides/[slug]`
- **Slug Format**: kebab-case (lowercase, hyphens instead of spaces)

## Content Strategy Guidelines

### Content Types That Work Well

1. **How-To Guides**: Step-by-step processes
2. **Location Guides**: Area-specific advice
3. **Comparison Guides**: Vehicle types, shops, prices
4. **Seasonal Guides**: Weather-specific advice
5. **Safety Guides**: Riding tips and precautions

### Effective Content Elements

- **Comparison Tables**: Easy to scan, highly shareable
- **Numbered Lists**: Great for step-by-step processes
- **Checkmark Lists**: Perfect for benefits and features
- **Local Tips**: Authentic Siargao-specific advice
- **Price Ranges**: Specific, current pricing information

### Siargao Rides Integration Points

1. **Opening Hook**: Mention platform as solution to common problems
2. **Mid-Content CTAs**: Natural recommendations to browse verified shops
3. **Comparison Sections**: Highlight platform benefits vs. alternatives
4. **FAQ Answers**: Include platform features in relevant answers
5. **Conclusion**: Strong call-to-action to use platform

## Example Topics for Future Posts

### High-Priority Topics
- "Motorbike Rental Prices in Siargao 2025"
- "Complete Siargao Transportation Guide"
- "Best Time to Visit Siargao (Weather & Rental Considerations)"
- "Siargao Road Conditions and Safety Tips"
- "Airport Transfer Options in Siargao"

### Seasonal Content
- "Rainy Season Vehicle Rentals in Siargao"
- "Peak Season Booking Guide for Siargao"
- "Surfing Season Transportation in Siargao"

### Advanced Topics
- "Long-term Vehicle Rentals in Siargao"
- "Group Transportation Options in Siargao"
- "Siargao Road Trip Itinerary with Rental Tips"

## Troubleshooting

### Common Issues

1. **Slug Not Found**: Ensure slug is added to both guide object and sitemap
2. **Image Not Loading**: Check file path and ensure image exists in `/public/images/`
3. **Formatting Issues**: Use exact markdown syntax shown in content guidelines
4. **SEO Problems**: Verify title length, meta description, and keyword inclusion

### Performance Considerations

- Keep images under 500KB for fast loading
- Limit content to 3,000 words maximum for readability
- Use static generation for all guide pages
- Test mobile responsiveness on different devices

## Quality Checklist

Before publishing new guides, verify:

- [ ] Title is under 60 characters and includes primary keyword
- [ ] Meta description is 150-160 characters
- [ ] Content is 1,500+ words of high value
- [ ] Includes 4-6 relevant FAQs
- [ ] Has 2-3 related posts for cross-linking
- [ ] Mentions Siargao Rides naturally 3-5 times
- [ ] Includes at least one comparison table or list
- [ ] All internal links work correctly
- [ ] Mobile responsive layout tested
- [ ] Page loads under 3 seconds

---

This documentation provides everything needed to efficiently create new blog posts using the Siargao Rides template system. Follow the AI agent prompt template for consistent, high-quality results that drive organic traffic and conversions.