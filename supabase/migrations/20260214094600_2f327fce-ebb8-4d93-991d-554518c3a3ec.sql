
-- Create site_settings table for all admin customization
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for frontend SEO)
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can insert settings
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update settings
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete settings
CREATE POLICY "Admins can delete site settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true);

-- Anyone can view branding assets
CREATE POLICY "Branding assets are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'branding');

-- Only admins can upload branding assets
CREATE POLICY "Admins can upload branding assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update branding assets
CREATE POLICY "Admins can update branding assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete branding assets
CREATE POLICY "Admins can delete branding assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));
