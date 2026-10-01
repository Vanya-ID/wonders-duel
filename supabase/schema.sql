CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    deleted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS score_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('base', 'pantheon', 'agora', 'both')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
    sheet_p1 JSONB,
    sheet_p2 JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS score_sessions_user_status_idx ON score_sessions (user_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at () RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS games_updated_at ON games;

CREATE TRIGGER games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

DROP TRIGGER IF EXISTS score_sessions_updated_at ON score_sessions;

CREATE TRIGGER score_sessions_updated_at BEFORE UPDATE ON score_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

ALTER TABLE score_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own games" ON games;

CREATE POLICY "Own games" ON games FOR ALL USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Own score sessions" ON score_sessions;

CREATE POLICY "Own score sessions" ON score_sessions FOR ALL USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'score_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE score_sessions;
    END IF;
END $$;
