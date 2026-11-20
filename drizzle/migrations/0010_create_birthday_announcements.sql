CREATE TABLE public.birthday_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  birthday date NOT NULL,
  message text NOT NULL DEFAULT '',
  image_url text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.birthday_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.birthday_announcements TO authenticated;
GRANT ALL ON public.birthday_announcements TO service_role;
ALTER TABLE public.birthday_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published birthdays are public" ON public.birthday_announcements FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins manage birthdays" ON public.birthday_announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));