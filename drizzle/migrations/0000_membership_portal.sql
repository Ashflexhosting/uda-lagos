CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.members (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  photo_path text,
  user_id uuid UNIQUE,
  opening numeric NOT NULL DEFAULT 0,
  dues numeric NOT NULL DEFAULT 0,
  welfare numeric NOT NULL DEFAULT 0,
  dev_levy numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_member_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.members WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "admins manage members" ON public.members FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "members read own" ON public.members FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount <> 0),
  paid_on date NOT NULL DEFAULT current_date,
  note text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "members read own payments" ON public.payments FOR SELECT TO authenticated USING (member_id = public.my_member_id());

CREATE TABLE public.payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL DEFAULT current_date,
  note text,
  file_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_proofs TO authenticated;
GRANT ALL ON public.payment_proofs TO service_role;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage proofs" ON public.payment_proofs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "members read own proofs" ON public.payment_proofs FOR SELECT TO authenticated USING (member_id = public.my_member_id());
CREATE POLICY "members submit own proofs" ON public.payment_proofs FOR INSERT TO authenticated WITH CHECK (member_id = public.my_member_id() AND status = 'pending');

CREATE TABLE public.dues_settings (
  year int PRIMARY KEY,
  dues numeric NOT NULL DEFAULT 0,
  welfare numeric NOT NULL DEFAULT 0,
  dev_levy numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dues_settings TO authenticated;
GRANT ALL ON public.dues_settings TO service_role;
ALTER TABLE public.dues_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone signed in reads dues" ON public.dues_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage dues" ON public.dues_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.dues_settings (year, dues, welfare, dev_levy) VALUES (2026, 10000, 15000, 5000);

CREATE VIEW public.member_balances WITH (security_invoker = true) AS
SELECT m.*,
  COALESCE((SELECT sum(p.amount) FROM public.payments p WHERE p.member_id = m.id), 0) AS paid,
  m.opening + m.dues + m.welfare + m.dev_levy - COALESCE((SELECT sum(p.amount) FROM public.payments p WHERE p.member_id = m.id), 0) AS balance
FROM public.members m;
GRANT SELECT ON public.member_balances TO authenticated;

CREATE OR REPLACE FUNCTION public.update_my_contact(_email text, _phone text, _address text, _photo_path text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.members SET email = _email, phone = _phone, address = _address, photo_path = _photo_path
  WHERE user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.update_my_contact(text,text,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_my_contact(text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_proof(_proof_id uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.payment_proofs;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO pr FROM public.payment_proofs WHERE id = _proof_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proof not found or already reviewed'; END IF;
  UPDATE public.payment_proofs SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END WHERE id = _proof_id;
  IF _approve THEN
    INSERT INTO public.payments (member_id, amount, paid_on, note, recorded_by)
    VALUES (pr.member_id, pr.amount, pr.paid_on, COALESCE('Proof: ' || pr.note, 'Approved payment proof'), auth.uid());
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_proof(uuid,boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.review_proof(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member') ON CONFLICT DO NOTHING;
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%@members.udalagos.app' THEN
    UPDATE public.members SET user_id = NEW.id
    WHERE id = (SELECT id FROM public.members WHERE user_id IS NULL AND lower(email) = lower(NEW.email) LIMIT 1);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "members manage own files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('photos','proofs') AND (storage.foldername(name))[1] = public.my_member_id())
  WITH CHECK (bucket_id IN ('photos','proofs') AND (storage.foldername(name))[1] = public.my_member_id());
CREATE POLICY "admins manage all files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('photos','proofs') AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id IN ('photos','proofs') AND public.has_role(auth.uid(),'admin'));