CREATE TABLE public.member_registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE,
 full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 3 AND 150),
 contact text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 member_id text REFERENCES public.members(id),
 reviewed_by uuid,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT registration_approval CHECK ((status = 'approved' AND member_id IS NOT NULL) OR (status <> 'approved' AND member_id IS NULL))
);
GRANT SELECT ON public.member_registrations TO authenticated;
GRANT ALL ON public.member_registrations TO service_role;
ALTER TABLE public.member_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own registration" ON public.member_registrations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Officers read registrations" ON public.member_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX members_one_record_per_account ON public.members(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE signup_name text;
BEGIN
 INSERT INTO public.user_roles(user_id,role) VALUES (NEW.id,'member') ON CONFLICT DO NOTHING;
 signup_name := btrim(coalesce(NEW.raw_user_meta_data->>'full_name',''));
 IF length(signup_name) BETWEEN 3 AND 150 AND coalesce(NEW.email,'') NOT LIKE '%@members.udalagos.app' THEN
  INSERT INTO public.member_registrations(user_id,full_name,contact)
  VALUES(NEW.id,signup_name,CASE WHEN coalesce(NEW.email,'') LIKE '%@phones.udalagos.app' THEN coalesce(NEW.raw_user_meta_data->>'phone','') ELSE coalesce(NEW.email,'') END)
  ON CONFLICT(user_id) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.submit_my_registration(_full_name text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); own_contact text;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 IF length(btrim(_full_name)) NOT BETWEEN 3 AND 150 THEN RAISE EXCEPTION 'Enter your full name (3–150 characters)'; END IF;
 IF EXISTS(SELECT 1 FROM public.members WHERE user_id=uid) THEN RAISE EXCEPTION 'Your membership is already linked'; END IF;
 SELECT CASE WHEN coalesce(email,'') LIKE '%@phones.udalagos.app' THEN coalesce(raw_user_meta_data->>'phone','') ELSE coalesce(email,'') END INTO own_contact FROM auth.users WHERE id=uid;
 INSERT INTO public.member_registrations(user_id,full_name,contact) VALUES(uid,btrim(_full_name),coalesce(own_contact,''))
 ON CONFLICT(user_id) DO UPDATE SET full_name=excluded.full_name,contact=excluded.contact,status='pending',member_id=NULL,reviewed_by=NULL,reviewed_at=NULL
 WHERE member_registrations.status='rejected';
END $$;
REVOKE ALL ON FUNCTION public.submit_my_registration(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_my_registration(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_member_registration(_request_id uuid,_member_id text,_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE req public.member_registrations%ROWTYPE; target public.members%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Officer access required'; END IF;
 SELECT * INTO req FROM public.member_registrations WHERE id=_request_id FOR UPDATE;
 IF NOT FOUND OR req.status <> 'pending' THEN RAISE EXCEPTION 'This request is no longer pending'; END IF;
 IF _approve THEN
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=req.user_id AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'This member must confirm their email before approval'; END IF;
  SELECT * INTO target FROM public.members WHERE id=_member_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Choose an existing member'; END IF;
  IF target.user_id IS NOT NULL THEN RAISE EXCEPTION 'This membership already has a linked account; do not replace it'; END IF;
  IF EXISTS(SELECT 1 FROM public.members WHERE user_id=req.user_id) THEN RAISE EXCEPTION 'This account already has a membership'; END IF;
  UPDATE public.members SET user_id=req.user_id WHERE id=target.id AND user_id IS NULL;
  UPDATE public.member_registrations SET status='approved',member_id=target.id,reviewed_by=auth.uid(),reviewed_at=now() WHERE id=req.id;
 ELSE
  UPDATE public.member_registrations SET status='rejected',member_id=NULL,reviewed_by=auth.uid(),reviewed_at=now() WHERE id=req.id;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_member_registration(uuid,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_member_registration(uuid,text,boolean) TO authenticated;