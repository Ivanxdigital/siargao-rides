# Chapter 4: Data Service & API Layers (`src/lib/service.ts`, `src/lib/api.ts`)

Welcome back! In [Chapter 3: Authentication & User Roles (AuthContext)](03_authentication___user_roles__authcontext__.md), we learned how the Siargao Rides app identifies *who* is using it and what permissions they have. Now that we know the user, how does the app actually get the data it needs to display, like a list of available motorbikes or rental shops?

This chapter explores two important files, `src/lib/api.ts` and `src/lib/service.ts`, which act as the organized way our app fetches and manages data.

## What Problem Do These Layers Solve? Keeping Data Access Tidy

Imagine different parts of our app need to show rental shop information:

*   The homepage needs to list all verified shops.
*   A shop details page needs to fetch information for one specific shop.
*   An admin page might need to list *all* shops, even unverified ones.

If every component directly talked to the [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md) database, our code would become messy and repetitive. What if we needed to change how we fetch shops? We'd have to update it in many different places! Also, how could we easily test our app's display without needing a live internet connection to the database?

We need a way to centralize and organize how our app gets data. This is where the **API Layer** (`api.ts`) and the **Service Layer** (`service.ts`) come in.

## Meet the Data Helpers: `api.ts` and `service.ts`

Think of getting data like getting books from a large library (our Supabase database).

### 1. `src/lib/api.ts`: The Direct Line to the Storage Room

Imagine `api.ts` as the **person working directly in the library's storage room**. They know exactly how to find the raw data on the shelves (how to talk to the Supabase database tables).

*   **Role:** Makes direct calls to the Supabase database using the Supabase client library.
*   **Focus:** Simply fetching or sending data to Supabase, without much extra logic.
*   **Example:** If you need all shop records, `api.ts` has a function that directly asks Supabase for them.

Here's a *very simplified* look at what a function in `api.ts` might look like to get all shops:

```typescript
// File: src/lib/api.ts (Simplified)
import { supabase } from './supabase'; // Our configured Supabase client
import { RentalShop } from './types'; // Type definition for a shop

// Function to get all shops directly from Supabase
export async function getShops(): Promise<RentalShop[]> {
  // Ask Supabase: "From the 'rental_shops' table, select all columns"
  const { data, error } = await supabase
    .from('rental_shops')
    .select('*');

  // Basic error handling
  if (error) {
    console.error('Error fetching shops:', error);
    return []; // Return empty array on error
  }

  // Return the data (list of shops) received from Supabase
  return data || [];
}
```

**Explanation:**

*   `import { supabase } ...`: We use the Supabase client we learned about in [Chapter 2](02_supabase_backend___admin_client_.md).
*   `supabase.from('rental_shops').select('*')`: This is the core Supabase command to get all data from the `rental_shops` table.
*   This function just fetches the raw data and returns it.

### 2. `src/lib/service.ts`: The Helpful Librarian

Now, imagine `service.ts` as the **helpful librarian** at the main desk. You don't go directly to the storage room; you ask the librarian for what you need.

*   **Role:** Acts as the primary way the rest of our application (like UI components) asks for data.
*   **Actions:**
    *   Often calls functions in `api.ts` to get the real data from the "storage room."
    *   Can add extra logic (e.g., sorting the shops, filtering only verified ones).
    *   Can decide whether to fetch *real* data (from `api.ts`) or provide *sample* data (mock data) for development or testing purposes.
*   **Example:** When the homepage needs shops, it asks the `service.ts` librarian. The librarian might then ask the `api.ts` worker for the data, or just give you a pre-made list if you're just testing the layout.

Here's how the corresponding `getShops` function might look in `service.ts`:

```typescript
// File: src/lib/service.ts (Simplified)
import * as api from './api'; // Import all functions from api.ts
import { mockShops } from './mock-data'; // Import sample shop data
import { RentalShop } from './types';

// Check an environment setting to see if we should use sample data
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// The function our app components will call
export async function getShops(): Promise<RentalShop[]> {
  // Should we use the sample data?
  if (USE_MOCK_DATA) {
    console.log('Using MOCK shop data');
    return mockShops; // Return the pre-made sample list
  } else {
    // Otherwise, ask the api.ts layer for real data
    console.log('Fetching REAL shop data from API');
    return api.getShops(); // Call the function in api.ts
  }
}
```

**Explanation:**

*   `import * as api from './api'`: We import the functions from our `api.ts` file.
*   `import { mockShops } ...`: We import sample data defined in another file (`mock-data.ts`).
*   `USE_MOCK_DATA`: This checks a setting (an environment variable) to decide if we are in "mock mode".
*   `if (USE_MOCK_DATA)`: If mock mode is on, it returns the `mockShops` directly.
*   `else { return api.getShops(); }`: If mock mode is off, it calls the `getShops` function inside `api.ts` to get the real data from Supabase.

## How They Work Together: The Data Flow

When a component in our app (like the homepage) needs a list of shops, the typical flow is:

1.  **Component:** Asks the `service.ts` "librarian" for shops using `service.getShops()`.
2.  **`service.ts` (Librarian):**
    *   Checks if `USE_MOCK_DATA` is true.
    *   If true, returns the sample `mockShops`.
    *   If false, calls the `api.getShops()` function to ask the "storage room worker".
3.  **`api.ts` (Storage Room Worker):** Receives the request from `service.ts`. It uses the Supabase client to fetch the shop data directly from the database.
4.  **Supabase Database:** Finds the requested shop data and sends it back.
5.  **`api.ts`:** Returns the data to `service.ts`.
6.  **`service.ts`:** Returns the data (either real or mock) to the original Component.
7.  **Component:** Receives the list of shops and displays them.

This creates a nice separation:

*   Components only talk to the `service.ts` librarian.
*   `service.ts` handles logic and decides the data source (real or mock).
*   `api.ts` handles the direct, raw communication with the database.

## The Mock Data Advantage

Why bother with `mockShops` and the `USE_MOCK_DATA` switch?

*   **Offline Development:** You can build and test the look and feel of your app pages even without an internet connection or a running database.
*   **Faster Development:** Fetching mock data is instant, making UI development cycles quicker.
*   **Testing:** You can create specific scenarios with mock data to test how your components handle different situations (e.g., an empty list, a shop with missing information).

The `service.ts` layer provides the perfect place to switch between the real `api.ts` calls and this mock data.

## Under the Hood: A Visual Flow

Here's a simplified diagram showing how a component gets shop data when *not* using mock data:

```mermaid
sequenceDiagram
    participant Component (e.g., Homepage)
    participant Service Layer (service.ts)
    participant API Layer (api.ts)
    participant Supabase DB

    Component (e.g., Homepage)->>+Service Layer (service.ts): getShops()
    Service Layer (service.ts)->>Service Layer (service.ts): Check USE_MOCK_DATA (false)
    Service Layer (service.ts)->>+API Layer (api.ts): api.getShops()
    API Layer (api.ts)->>+Supabase DB: Fetch 'rental_shops' data
    Supabase DB-->>-API Layer (api.ts): Return shop data
    API Layer (api.ts)-->>-Service Layer (service.ts): Return shop data
    Service Layer (service.ts)-->>-Component (e.g., Homepage): Return shop data
```

**Code Snippets Revisited:**

*   **`service.ts` Switch:** The key part is the `if/else` based on `USE_MOCK_DATA`. This environment variable is usually set when you run the development server, allowing you to easily turn mock data on or off.

    ```typescript
    // File: src/lib/service.ts (Focus on the switch)

    // Check an environment setting
    const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

    export async function getShops(): Promise<RentalShop[]> {
      if (USE_MOCK_DATA) {
        // Return sample data directly
        return mockShops;
      } else {
        // Call the function in api.ts for real data
        return api.getShops();
      }
    }
    ```

*   **`api.ts` Direct Call:** This function focuses solely on the database interaction.

    ```typescript
    // File: src/lib/api.ts (Focus on Supabase call)
    import { supabase } from './supabase';

    export async function getShops(): Promise<RentalShop[]> {
      // The actual Supabase query
      const { data, error } = await supabase
        .from('rental_shops')
        .select('*');

      if (error) { /* ... error handling ... */ return []; }
      return data || [];
    }
    ```

This structure keeps concerns separate: presentation components ask `service.ts`, `service.ts` orchestrates and potentially uses mock data, and `api.ts` talks directly to Supabase.

## Conclusion

You've now learned about the Data Service (`service.ts`) and API (`api.ts`) layers in Siargao Rides Summarised!

*   **`api.ts`** is the direct interface to our [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md), handling raw data fetching.
*   **`service.ts`** is the intermediary "librarian" that our application components talk to. It calls `api.ts` for real data but can also provide mock data for development and add extra logic.
*   This separation keeps our code organized, makes it easier to manage data fetching, and allows us to easily switch to using sample data when needed.

With ways to identify users ([Chapter 3](03_authentication___user_roles__authcontext__.md)) and fetch data (this chapter), we can now look at specific features. How does a user actually book a motorbike?

Let's dive into the core functionality in [Chapter 5: Booking System](05_booking_system_.md)!

---

Generated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)