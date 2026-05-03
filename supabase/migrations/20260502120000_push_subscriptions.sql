-- Push subscriptions para Web Push Notifications (VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint    text        NOT NULL UNIQUE,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  role        text        NOT NULL CHECK (role IN ('admin', 'professor', 'aluno')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuário gerencia apenas suas próprias subscriptions
CREATE POLICY "push_subscriptions_own"
  ON push_subscriptions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Staff (admin/professor) pode SELECT em todas (necessário para envio server-side via service_role)
-- O envio real usa service_role key na API route, então esta policy é para queries autenticadas de staff
CREATE POLICY "push_subscriptions_staff_read"
  ON push_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_access
      WHERE staff_access.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND staff_access.is_active = true
    )
  );

-- Índices para queries de envio por role
CREATE INDEX IF NOT EXISTS push_subscriptions_role_idx ON push_subscriptions (role);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);

-- Trigger para manter updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_push_subscriptions_updated_at();
