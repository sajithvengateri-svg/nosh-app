-- Grant admin role to all 3 dev accounts so they can access
-- the admin Control Centre without separate login.
-- Uses profiles.email to resolve user_id.

INSERT INTO user_roles (user_id, role)
SELECT p.user_id, 'admin'
FROM profiles p
WHERE p.email IN ('admin@chefos.app', 'chef@chefos.app', 'vendor@chefos.app')
ON CONFLICT (user_id, role) DO NOTHING;
