-- Create trigger to insert into public.users when a new auth user is created
DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add trigger to keep users.updated_at in sync on updates
DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;