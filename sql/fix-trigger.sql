-- Fix the handle_new_user function to not use enum conversion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  role_val text;
BEGIN
  -- Extract role from metadata with a default
  role_val := COALESCE(new.raw_user_meta_data->>'role', 'tourist');
  
  -- Validate role value against allowed values
  IF role_val NOT IN ('tourist', 'shop_owner', 'admin') THEN
    role_val := 'tourist';
  END IF;
  
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    role_val, -- Now uses the text value directly
    now(), 
    now()
  );
  RETURN new;
END;
$function$; 