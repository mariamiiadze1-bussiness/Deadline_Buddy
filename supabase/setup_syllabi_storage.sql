-- Private syllabus uploads. The first folder in each object path is the owner user ID.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'syllabi',
  'syllabi',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload own syllabi" ON storage.objects;
CREATE POLICY "Users can upload own syllabi"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'syllabi'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can read own syllabi" ON storage.objects;
CREATE POLICY "Users can read own syllabi"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'syllabi'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
