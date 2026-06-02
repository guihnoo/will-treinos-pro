-- Security Fix A1: Remover user_metadata de wt_is_staff()
-- user_metadata é editável pelo próprio usuário via auth.updateUser().
-- A função deve confiar apenas em app_metadata (não editável pelo usuário) + staff_access.

CREATE OR REPLACE FUNCTION public.wt_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (
    -- app_metadata NÃO é editável pelo usuário (apenas pelo service role)
    lower(
      COALESCE(
        auth.jwt() -> 'app_metadata' ->> 'role',
        ''
      )
    ) IN ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher')
  )
  OR EXISTS (
    -- staff_access também não é editável pelo aluno (sem policy de INSERT/UPDATE para aluno)
    SELECT 1
    FROM public.staff_access sa
    WHERE COALESCE(sa.is_active, true)
      AND lower(btrim(COALESCE(sa.email, ''))) = lower(btrim(COALESCE(auth.jwt() ->> 'email', '')))
      AND lower(btrim(COALESCE(sa.role, ''))) IN ('admin', 'coach')
  );
$$;

COMMENT ON FUNCTION public.wt_is_staff IS
'Verifica se o usuário atual é staff via app_metadata (não editável) ou staff_access. user_metadata removido por ser editável pelo usuário.';
