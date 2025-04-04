-- Create booking_history table
CREATE TABLE IF NOT EXISTS public.booking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    metadata JSONB,
    FOREIGN KEY (booking_id) REFERENCES public.rentals(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON public.booking_history(booking_id);

-- Create vehicle_reviews table
CREATE TABLE IF NOT EXISTS public.vehicle_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    status TEXT DEFAULT 'published',
    FOREIGN KEY (booking_id) REFERENCES public.rentals(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES public.rental_shops(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicle_reviews_vehicle_id ON public.vehicle_reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_reviews_booking_id ON public.vehicle_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_reviews_user_id ON public.vehicle_reviews(user_id);

-- Create date_change_requests table
CREATE TABLE IF NOT EXISTS public.date_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    original_start_date TIMESTAMPTZ NOT NULL,
    original_end_date TIMESTAMPTZ NOT NULL,
    requested_start_date TIMESTAMPTZ NOT NULL,
    requested_end_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    processed_by UUID,
    response_note TEXT,
    FOREIGN KEY (booking_id) REFERENCES public.rentals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_date_change_requests_booking_id ON public.date_change_requests(booking_id);

-- Add row level security policies
ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_change_requests ENABLE ROW LEVEL SECURITY;

-- Policies for booking_history
CREATE POLICY "Users can view their own booking history"
ON public.booking_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rentals
    WHERE rentals.id = booking_history.booking_id
    AND rentals.user_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can view booking history for their shop"
ON public.booking_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rentals r
    JOIN public.vehicles v ON r.vehicle_id = v.id
    JOIN public.rental_shops s ON v.shop_id = s.id
    WHERE r.id = booking_history.booking_id
    AND s.owner_id = auth.uid()
  )
);

-- Policies for vehicle_reviews
CREATE POLICY "Anyone can view published reviews"
ON public.vehicle_reviews
FOR SELECT
USING (status = 'published');

CREATE POLICY "Users can CRUD their own reviews"
ON public.vehicle_reviews
USING (user_id = auth.uid());

CREATE POLICY "Shop owners can view all reviews for their vehicles"
ON public.vehicle_reviews
FOR SELECT
USING (
  shop_id IN (
    SELECT id FROM rental_shops
    WHERE owner_id = auth.uid()
  )
);

-- Policies for date_change_requests
CREATE POLICY "Users can view and create their own date change requests"
ON public.date_change_requests
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own date change requests"
ON public.date_change_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Shop owners can view date change requests for their bookings"
ON public.date_change_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rentals r
    JOIN public.vehicles v ON r.vehicle_id = v.id
    JOIN public.rental_shops s ON v.shop_id = s.id
    WHERE r.id = date_change_requests.booking_id
    AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can update date change requests for their bookings"
ON public.date_change_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.rentals r
    JOIN public.vehicles v ON r.vehicle_id = v.id
    JOIN public.rental_shops s ON v.shop_id = s.id
    WHERE r.id = date_change_requests.booking_id
    AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rentals r
    JOIN public.vehicles v ON r.vehicle_id = v.id
    JOIN public.rental_shops s ON v.shop_id = s.id
    WHERE r.id = date_change_requests.booking_id
    AND s.owner_id = auth.uid()
  )
); 