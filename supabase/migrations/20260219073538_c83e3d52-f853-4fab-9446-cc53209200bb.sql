
-- Create trigger for handle_new_user on auth.users INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for handle_new_signup_event on auth.users INSERT
CREATE TRIGGER on_auth_signup_event
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_signup_event();
