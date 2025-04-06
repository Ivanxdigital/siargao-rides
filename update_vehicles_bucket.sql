-- Update the vehicles bucket to allow PDF files
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'application/pdf') 
WHERE id = 'vehicles' AND NOT 'application/pdf' = ANY(allowed_mime_types);

-- Check updated configuration
SELECT id, allowed_mime_types FROM storage.buckets WHERE id = 'vehicles'; 