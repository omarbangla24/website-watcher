
CREATE TABLE public.website_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('up', 'down')),
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public table, no auth needed
ALTER TABLE public.website_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read checks"
ON public.website_checks FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert checks"
ON public.website_checks FOR INSERT
WITH CHECK (true);

-- Index for domain lookups
CREATE INDEX idx_website_checks_domain ON public.website_checks (domain);
CREATE INDEX idx_website_checks_checked_at ON public.website_checks (checked_at DESC);
