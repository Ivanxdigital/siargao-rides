# Siargao Rides - Vehicle Rental Directory

A modern web application that connects local vehicle rental shops in Siargao Island, Philippines, with tourists looking to rent motorcycles, cars, and tuktuks.

![GitHub repo](https://github.com/Ivanxdigital/siargao-rides)

## 🏝️ Project Overview

Siargao Rides is a platform that allows tourists to:
- Search and filter vehicle rentals based on location, dates, budget, and vehicle type
- Browse local rental shops with detailed information
- See real photos, pricing (daily/weekly/monthly), and reviews
- Make reservations directly through the platform

Shop owners can:
- Create their own listings
- Manage their inventory
- Receive direct bookings
- Get visibility to tourists visiting the island

## 🚀 Current Development Stage

This project is in early development with focus on the frontend UI. The current implementation includes:

- Project structure using Next.js App Router
- Basic page routing and layouts
- Core UI components
- TailwindCSS setup with custom theming
- Mobile-responsive design

**Note:** The backend and data persistence are planned for future phases.

## 🧰 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS with custom theme
- **UI Components:** Custom components with ShadCN UI principles
- **Animation:** Framer Motion (planned)
- **Future Backend:** Supabase (planned)

## 📁 Project Structure

```
siargao-rides/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── browse/      # Browse listings page
│   │   ├── contact/     # Contact page
│   │   ├── register/    # Shop registration
│   │   ├── shop/[id]/   # Individual shop page
│   │   ├── globals.css  # Global styles
│   │   ├── layout.tsx   # Root layout with Navbar/Footer
│   │   └── page.tsx     # Homepage
│   ├── components/      # Reusable components
│   │   ├── layout/      # Layout components (Navbar, Footer)
│   │   ├── ui/          # UI components (Button, Badge, etc.)
│   │   ├── VehicleCard.tsx # Vehicle listing card
│   │   ├── SearchBar.tsx # Search component
│   │   └── RentalShopCard.tsx # Shop listing card
│   └── lib/             # Utility functions
├── tailwind.config.js   # TailwindCSS configuration
├── project-brief.md     # Project vision and requirements
├── features.md          # Detailed feature specifications
├── ui-components.md     # UI component specifications
└── roadmap.md           # Development roadmap
```

## 🎯 Core Features

### Implemented:
- Base layout with responsive Navbar and Footer
- Homepage with hero section
- Basic routing structure
- UI component foundations

### In Progress:
- Search functionality
- Browse page with filters
- Shop profile pages
- Registration forms

### Planned:
- Authentication for shop owners
- Image upload for listings
- Booking system
- Reviews and ratings
- Google Maps integration

## 🎨 Design System

The UI follows these principles:
- **Theme:** Dark, modern, minimalistic
- **Aesthetic:** Tropical but clean
- **Mobile-first:** Fully responsive for all devices
- **Accessibility:** WCAG compliant

The color scheme uses:
- Primary: Teal/aqua tones (representing ocean)
- Background: Dark charcoal
- Accents: Coral highlights

## 🔧 Setup and Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ivanxdigital/siargao-rides.git
cd siargao-rides
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Development Guidelines

When contributing to this project:

1. **Follow the existing code style** - Use TypeScript for type safety
2. **Mobile-first approach** - Always design with mobile in mind first
3. **Component-based architecture** - Create reusable components
4. **Performance optimizations** - Lazy loading, code splitting when appropriate
5. **Accessibility** - Ensure components are accessible

## 🗺️ Development Roadmap

The project follows this development plan:

1. **Phase 1:** Core UI components and structure ✅
2. **Phase 2:** Complete all page templates and navigation
3. **Phase 3:** Add search and filtering functionality
4. **Phase 4:** Implement forms and user interactions
5. **Phase 5:** Connect to backend (Supabase)
6. **Phase 6:** Authentication and user roles
7. **Phase 7:** Booking system and notifications
8. **Phase 8:** Reviews and ratings
9. **Phase 9:** Payment integration
10. **Phase 10:** Testing and deployment

## 📊 Data Model (Planned)

The application will eventually use these data models:

- **Shops**
  - id, name, description, location, contact info, ratings, etc.
  
- **Bikes**
  - id, shop_id, model, type, photos, daily_rate, weekly_rate, monthly_rate, availability
  
- **Users**
  - id, name, email, role (tourist/shop owner)
  
- **Bookings**
  - id, bike_id, user_id, start_date, end_date, status, payment_info

## 🤝 Contributing

Contributions are welcome! Please check the [issues](https://github.com/Ivanxdigital/siargao-rides/issues) page for current tasks.

## 📄 License

This project is proprietary and not open for redistribution.

## 📞 Contact

For questions or support, please reach out to project maintainers.
