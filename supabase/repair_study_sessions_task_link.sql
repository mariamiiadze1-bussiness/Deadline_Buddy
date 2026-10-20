-- Repair installations where study_sessions was created before its optional
-- task relationship was added. The ownership trigger expects this column.
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS task_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'study_sessions_task_id_fkey'
      AND conrelid = 'public.study_sessions'::regclass
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_task_id_fkey
      FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS study_sessions_task_id_idx
  ON public.study_sessions(task_id);

-- Make PostgREST pick up the repaired table definition immediately.
NOTIFY pgrst, 'reload schema';
