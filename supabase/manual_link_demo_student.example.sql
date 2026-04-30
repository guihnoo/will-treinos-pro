-- AFTER you sign in once with Google (or email), copy your UUID from:
-- Supabase Dashboard → Authentication → Users → [your user] → User UID
-- Then run (replace placeholders):

-- UPDATE public.students
-- SET auth_user_id = '00000000-0000-0000-0000-000000000000'::uuid
-- WHERE id = 'demo_stu_ricardo';

-- Alternative when emails match (no auth_user_id needed): ensure auth.users.email matches students.email
-- e.g. demo seed uses ricardo.demo@willtreinos.com.br — use that email on the account.
