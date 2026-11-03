CREATE TABLE public.association_updates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL,
 body text NOT NULL,
 kind text NOT NULL DEFAULT 'news' CHECK (kind IN ('news', 'event')),
 event_date date,
 location text,
 published boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.association_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.association_updates TO authenticated;
GRANT ALL ON public.association_updates TO service_role;
ALTER TABLE public.association_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published updates" ON public.association_updates FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "admins manage all updates" ON public.association_updates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));