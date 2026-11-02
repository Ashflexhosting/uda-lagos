CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member') ON CONFLICT DO NOTHING;
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%@members.udalagos.app' THEN
    UPDATE public.members SET user_id = NEW.id
    WHERE id = (SELECT id FROM public.members WHERE user_id IS NULL AND lower(email) = lower(NEW.email) LIMIT 1);
  END IF;
  RETURN NEW;
END $$;