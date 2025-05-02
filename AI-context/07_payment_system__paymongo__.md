# Chapter 7: Payment System (PayMongo)

Welcome back! In [Chapter 6: Shop & Vehicle Management](06_shop___vehicle_management_.md), we saw how shop owners add their shops and list their vehicles on Siargao Rides. Now, when a customer wants to book one of those vehicles online, how do we handle the payment securely?

## What Problem Does the Payment System Solve? Being a Secure Digital Cashier

Imagine a customer completing their booking in [Chapter 5: Booking System](05_booking_system_.md). They've chosen their dates and vehicle, and now they need to pay. Handling credit card numbers or online wallet details is extremely sensitive. We can't just store this information directly in our database – that would be insecure and violate regulations!

We need a trusted partner, a **secure digital cashier**, to handle the actual money transfer. This cashier needs to:

1.  Securely accept payment details (like card numbers or GCash login) without our app ever seeing them directly.
2.  Process the payment with the bank or e-wallet provider.
3.  Tell our application whether the payment was successful or failed.
4.  Handle different payment methods popular in the Philippines, like cards and GCash.
5.  Manage potential requirements like deposits.

This is where our **Payment System**, primarily using the **PayMongo** service, comes in.

## Meet PayMongo: Our Trusted Payment Partner

PayMongo is a popular online payment processing service in the Philippines. Think of them as the secure vault and transaction processor for our app. We don't build our own vault; we integrate with PayMongo's secure system.

Our Payment System uses PayMongo to:

*   Accept credit/debit card payments.
*   Accept payments via GCash.
*   Handle the secure flow of money without needing to store sensitive user payment details ourselves.

## Key Concepts

1.  **PayMongo:** The external service we use. Our application talks to PayMongo's servers ([API Routes (`src/app/api/`)](01_api_routes___src_app_api____.md) talk to PayMongo API) and uses PayMongo's tools in the user's browser (frontend components interact with PayMongo's secure fields).
2.  **Payment Intent:** This is like telling PayMongo, "Hey, I have a customer who wants to pay ₱1000 for a booking. Get ready!" We create this *before* the user enters their card details. PayMongo gives us back a special ID (`paymentIntentId`) and a key (`clientKey`) for this specific transaction attempt.
3.  **Payment Method:** This represents the user's payment details (e.g., their card number or GCash account) in a secure way. The user enters their details into special fields provided by PayMongo's tools in the browser, and PayMongo gives back a secure token (`paymentMethodId`) representing those details. Our app only handles this token, never the raw card number.
4.  **Attaching:** This is the step where we tell PayMongo, "Okay, for that Payment Intent (ID: `pi_...`), use this specific Payment Method (ID: `pm_...`) to complete the transaction."
5.  **Webhook:** Imagine PayMongo sending a notification back to our app's dedicated mailbox (`/api/payments/webhook`). When a payment succeeds or fails *after* the user has interacted (e.g., after a GCash redirect or bank verification), PayMongo sends a message to this webhook. Our app listens here to update the booking status in our [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md) database.
6.  **Deposits:** Some bookings might require a smaller upfront payment (a deposit) instead of the full amount. Our system can create specific payment intents for these deposits.

## How It Works: The Payment Flow (Card Example)

Let's follow the journey when a user pays for their booking with a credit card:

1.  **User Reaches Payment:** The user confirms their booking details and proceeds to the payment page (`src/app/booking/payment/[id]/page.tsx`).
2.  **Create Payment Intent (Backend):**
    *   The frontend asks our backend API: `/api/payments/create-intent`.
    *   Our API route talks to PayMongo's API: "Create an intent for ₱X amount for booking Y."
    *   PayMongo replies with a `paymentIntentId` and a `clientKey`.
    *   Our API route saves the `paymentIntentId` in our `paymongo_payments` table (linked to the `rental_id`) and sends the `clientKey` back to the frontend.
3.  **Display Payment Form (Frontend):**
    *   The frontend receives the `clientKey`.
    *   It uses PayMongo's special frontend tools (like the `PayMongoForm.tsx` component) to display secure input fields for the card number, expiry, and CVC. The `clientKey` tells these fields which transaction they belong to.
4.  **User Enters Details:** The user types their card information directly into the secure PayMongo fields. Our website code *never* sees or touches the raw card number.
5.  **Create Payment Method (Frontend -> PayMongo):**
    *   When the user clicks "Pay", the PayMongo frontend tool securely sends the card details *directly* to PayMongo's servers.
    *   PayMongo securely creates a `paymentMethodId` representing that card and sends this ID back to our frontend.
6.  **Attach Payment Method (Backend):**
    *   The frontend sends the `paymentMethodId` and the original `paymentIntentId` to our backend API: `/api/payments/attach-method`.
    *   Our API route tells PayMongo's API: "Attach this method (`pm_...`) to this intent (`pi_...`)."
7.  **PayMongo Processes:** PayMongo attempts to charge the card via the bank networks. This might involve:
    *   Immediate success/failure.
    *   Requiring 3D Secure (a verification step where the user might get an OTP from their bank). If needed, PayMongo tells our API, which tells the frontend to show a verification pop-up/redirect provided by PayMongo.
8.  **Payment Confirmation (Webhook):**
    *   Once the payment is definitively successful or failed, PayMongo sends a secure message (the webhook notification) to our dedicated API endpoint: `/api/payments/webhook`.
    *   Our `/api/payments/webhook` route verifies the message came genuinely from PayMongo.
    *   It reads the payment status (e.g., `payment.paid` or `payment.failed`).
    *   It updates the corresponding `paymongo_payments` record and the `rentals` record in our [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md) database (e.g., setting `status` to `confirmed` or `payment_status` to `paid`).
9.  **User Feedback (Frontend):** The payment page might periodically check the status (`/api/payments/check-status`) or wait for the webhook update via other means, then redirects the user to the confirmation page (`src/app/booking/confirmation/[id]/page.tsx`).

## Key API Routes Involved

These [API Routes (`src/app/api/`)](01_api_routes___src_app_api____.md) handle the communication with PayMongo and our database:

*   **`/api/payments/create-intent`:**
    *   **Input:** `rentalId`, `amount`, `description`.
    *   **Action:** Calls PayMongo to create a payment intent, saves the intent ID in our DB, returns the `clientKey` to the frontend.

    ```typescript
    // Simplified: src/app/api/payments/create-intent/route.ts
    import { NextRequest, NextResponse } from 'next/server';
    import { createPaymentIntent } from '@/lib/paymongo'; // Our helper function
    import { supabaseAdmin } from '@/lib/admin'; // Use admin client for DB write

    export async function POST(request: NextRequest) {
      const { rentalId, amount, description } = await request.json();
      // TODO: Validate input and check user authentication

      // 1. Convert amount to cents for PayMongo
      const amountInCents = Math.round(amount * 100);

      // 2. Call PayMongo to create the intent
      const intent = await createPaymentIntent(amountInCents, description);

      // 3. Save intent details securely in our database
      await supabaseAdmin.from('paymongo_payments').insert({
        rental_id: rentalId,
        payment_intent_id: intent.id,
        client_key: intent.attributes.client_key,
        amount: amount,
        status: intent.attributes.status,
      });

      // 4. Return ONLY the client_key to the frontend
      return NextResponse.json({ client_key: intent.attributes.client_key });
    }
    ```

*   **`/api/payments/attach-method`:**
    *   **Input:** `paymentIntentId`, `paymentMethodId`, `clientKey`.
    *   **Action:** Calls PayMongo to attach the method to the intent, potentially triggering 3D Secure. Updates the payment status in our DB. Returns the latest payment status/next action.

    ```typescript
    // Simplified: src/app/api/payments/attach-method/route.ts
    import { NextRequest, NextResponse } from 'next/server';
    import { attachPaymentMethod } from '@/lib/paymongo'; // Our helper
    import { supabaseAdmin } from '@/lib/admin';

    export async function POST(request: NextRequest) {
      const { paymentIntentId, paymentMethodId, clientKey } = await request.json();
      // TODO: Validate input

      // 1. Call PayMongo to attach the method
      const updatedIntent = await attachPaymentMethod(paymentIntentId, paymentMethodId, clientKey);

      // 2. Update the status in our database
      await supabaseAdmin.from('paymongo_payments')
        .update({ status: updatedIntent.attributes.status })
        .eq('payment_intent_id', paymentIntentId);

      // 3. Return the result (status, next_action for 3DS)
      return NextResponse.json({ payment: updatedIntent.attributes });
    }
    ```

*   **`/api/payments/webhook`:**
    *   **Input:** A signed POST request from PayMongo containing payment event data.
    *   **Action:** Verifies the signature. If valid, reads the event type (e.g., `payment.paid`). Updates the `rentals` table status (`confirmed`, `paid`) and the `paymongo_payments` status in our database using `supabaseAdmin`.

    ```typescript
    // Simplified: src/app/api/payments/webhook/route.ts
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@supabase/supabase-js'; // Use raw client for webhook
    import { verifyWebhookSignature } from '@/lib/paymongo'; // Signature checker

    // Initialize Supabase Admin Client directly for webhook
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    export async function POST(request: NextRequest) {
      const rawBody = await request.text();
      const signature = request.headers.get('paymongo-signature');
      const secret = process.env.PAYMONGO_WEBHOOK_SECRET!;

      // 1. Verify the webhook signature (CRUCIAL!)
      if (!verifyWebhookSignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // 2. Parse the event data
      const event = JSON.parse(rawBody).data;
      const paymentIntentId = event.attributes.data.attributes.payment_intent_id;

      // 3. Handle the event type
      if (event.attributes.type === 'payment.paid') {
        // Find the rental associated with this payment intent
        const { data: paymentRecord } = await supabase
          .from('paymongo_payments')
          .select('rental_id')
          .eq('payment_intent_id', paymentIntentId)
          .single();

        if (paymentRecord) {
          // Update rental status to 'confirmed' and payment_status to 'paid'
          await supabase.from('rentals')
            .update({ status: 'confirmed', payment_status: 'paid' })
            .eq('id', paymentRecord.rental_id);
        }
      }
      // TODO: Handle other events like payment.failed

      return NextResponse.json({ received: true });
    }
    ```

*   **`/api/payments/create-gcash-source`:** (For GCash)
    *   **Input:** `rentalId`, `amount`, `successUrl`, `failureUrl`, billing info.
    *   **Action:** Calls PayMongo to create a GCash "source", which generates a `checkout_url`. Saves source info in DB. Returns the `checkout_url` to the frontend. The frontend then redirects the user to this URL to complete payment in the GCash app/website.

*   **`/api/payments/gcash-webhook`:** (For GCash)
    *   **Input:** A signed POST request from PayMongo (event: `source.chargeable`).
    *   **Action:** Verifies signature. Calls PayMongo again to actually *create a payment* using the now chargeable source. Updates DB similar to the card webhook.

*   **`/api/payments/create-deposit-intent`:** Similar to `create-intent` but specifically flags the payment as a deposit (often using metadata).

## Under the Hood: Secure Communication

The key is the separation of concerns and secure communication channels:

1.  **User's Browser <-> PayMongo:** Sensitive details (card numbers) are entered into PayMongo's secure fields/redirects. Our app's frontend code never touches them.
2.  **Our Server <-> PayMongo Server:** Our API routes talk to PayMongo's API using secret keys (stored securely on our server, never in the frontend code) to create intents, attach methods, and check status.
3.  **PayMongo Server -> Our Server (Webhook):** PayMongo sends notifications to our secure webhook endpoint. We verify these notifications using a shared secret.
4.  **Our Server <-> Our Database:** Our API routes (especially the webhook) update the booking status in our Supabase database.

Here’s a simplified sequence diagram for a successful card payment:

```mermaid
sequenceDiagram
    participant Browser (Frontend)
    participant API Route (e.g., /api/payments/*)
    participant PayMongo API
    participant Webhook (/api/payments/webhook)
    participant Supabase DB

    Browser (Frontend)->>+API Route (e.g., /api/payments/*): Request to create Payment Intent (amount)
    API Route (e.g., /api/payments/*)->>+PayMongo API: Create Intent Request (using Secret Key)
    PayMongo API-->>-API Route (e.g., /api/payments/*): Return Intent ID & Client Key
    API Route (e.g., /api/payments/*)->>Browser (Frontend): Return Client Key
    Note over Browser (Frontend): User enters card details into PayMongo secure fields
    Browser (Frontend)->>PayMongo API: Securely submit card details (via PayMongo JS)
    PayMongo API-->>Browser (Frontend): Return Payment Method ID
    Browser (Frontend)->>+API Route (e.g., /api/payments/*): Request to attach Method (Intent ID, Method ID)
    API Route (e.g., /api/payments/*)->>+PayMongo API: Attach Method Request (using Secret Key)
    PayMongo API-->>-API Route (e.g., /api/payments/*): Processing / Requires Action
    Note over PayMongo API, Webhook (/api/payments/webhook): PayMongo processes payment with bank...
    PayMongo API->>+Webhook (/api/payments/webhook): Payment Paid Notification (Signed)
    Webhook (/api/payments/webhook)->>Webhook (/api/payments/webhook): Verify Signature
    Webhook (/api/payments/webhook)->>+Supabase DB: Update Rental Status (Confirmed, Paid)
    Supabase DB-->>-Webhook (/api/payments/webhook): Update OK
    Webhook (/api/payments/webhook)-->>-PayMongo API: Acknowledge Webhook (Received)
    Note over Browser (Frontend), Supabase DB: Frontend checks status or gets update, redirects to Confirmation
```

## Conclusion

You've learned how Siargao Rides Summarised handles secure online payments using **PayMongo** as its digital cashier.

*   We rely on **PayMongo** to securely process card and GCash payments.
*   The process involves creating **Payment Intents**, securely handling **Payment Methods**, and **Attaching** them.
*   Our app **never** stores or directly handles sensitive card details.
*   **Webhooks** are crucial for receiving payment confirmation from PayMongo and updating our database reliably.
*   Specific [API Routes (`src/app/api/`)](01_api_routes___src_app_api____.md) manage the communication between our app, PayMongo, and our [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md). Helper files like `src/lib/paymongo.ts` and `src/lib/paymongo-ewallet.ts` contain the logic for interacting with PayMongo's API.

With payments handled, how do administrators manage the platform, verify shops and vehicles, and oversee operations?

Let's explore the admin side in [Chapter 8: Admin Dashboard & Verification](08_admin_dashboard___verification_.md)!

---

Generated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)