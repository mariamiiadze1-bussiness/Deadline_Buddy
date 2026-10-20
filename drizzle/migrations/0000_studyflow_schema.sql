CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  university_name text,
  current_semester text,
  timezone text NOT NULL DEFAULT 'UTC',
  week_starts_on smallint NOT NULL DEFAULT 1 CHECK (week_starts_on IN (0,1)),
  study_goals text,
  notify_due_today boolean NOT NULL DEFAULT true,
  notify_due_soon boolean NOT NULL DEFAULT true,
  notify_overdue boolean NOT NULL DEFAULT true,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 120),
  course_code text, instructor_name text, semester text,
  color text NOT NULL DEFAULT '#2457A7' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.courses(user_id);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  exam_id uuid,
  title text NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 200),
  description text,
  task_type text NOT NULL DEFAULT 'assignment' CHECK (task_type IN ('assignment','homework','project','reading','exam_prep','other')),
  due_at timestamptz NOT NULL,
  has_due_time boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','completed')),
  estimated_duration_minutes integer CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes BETWEEN 1 AND 10000),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.tasks(user_id, due_at);
CREATE INDEX ON public.tasks(course_id);
CREATE INDEX ON public.tasks(user_id, status);

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 200),
  exam_at timestamptz NOT NULL,
  has_exam_time boolean NOT NULL DEFAULT false,
  location_or_format text, notes text, study_goal text,
  preparation_status text NOT NULL DEFAULT 'not_started' CHECK (preparation_status IN ('not_started','in_progress','ready')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.exams(user_id, exam_at);
CREATE INDEX ON public.exams(course_id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_exam_fk FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE SET NULL;

CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 200),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','done','skipped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX ON public.study_sessions(user_id, starts_at);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['courses','tasks','exams','study_sessions'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own select" ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "own insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "own update" ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "own delete" ON public.%I FOR DELETE TO authenticated USING (user_id = auth.uid())', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.check_ownership() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id <> OLD.user_id THEN RAISE EXCEPTION 'Cannot change owner'; END IF;
  IF NEW.course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM courses WHERE id = NEW.course_id AND user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'Course not found'; END IF;
  IF TG_TABLE_NAME = 'tasks' THEN
    IF NEW.exam_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM exams WHERE id = NEW.exam_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Exam not found'; END IF;
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN NEW.completed_at = now(); END IF;
    IF NEW.status <> 'completed' THEN NEW.completed_at = NULL; END IF;
  END IF;
  IF TG_TABLE_NAME = 'study_sessions' THEN
    IF NEW.task_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tasks WHERE id = NEW.task_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Task not found';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','courses','tasks','exams','study_sessions'] LOOP
    EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['tasks','exams','study_sessions'] LOOP
    EXECUTE format('CREATE TRIGGER own_check BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.check_ownership()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Demo data for the signed-in user only
CREATE OR REPLACE FUNCTION public.load_demo_data() RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); c1 uuid; c2 uuid; c3 uuid; e1 uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  INSERT INTO courses(user_id,name,course_code,color,description) VALUES (uid,'Marketing Management (Demo)','MKT 301','#2457A7','Sample course') RETURNING id INTO c1;
  INSERT INTO courses(user_id,name,course_code,color,description) VALUES (uid,'Business Communications (Demo)','BUS 210','#0E9F6E','Sample course') RETURNING id INTO c2;
  INSERT INTO courses(user_id,name,course_code,color,description) VALUES (uid,'Organizational Behavior (Demo)','MGT 220','#D97706','Sample course') RETURNING id INTO c3;
  INSERT INTO exams(user_id,course_id,title,exam_at,has_exam_time,location_or_format) VALUES (uid,c1,'Marketing Management midterm (Demo)', date_trunc('day', now()) + interval '10 days 10 hours', true, 'Room B204') RETURNING id INTO e1;
  INSERT INTO tasks(user_id,course_id,title,task_type,due_at,priority,status,estimated_duration_minutes) VALUES
    (uid,c1,'Submit the marketing case study (Demo)','assignment', date_trunc('day', now()) + interval '23 hours 59 minutes','high','in_progress',120),
    (uid,c2,'Prepare the business communications presentation (Demo)','project', date_trunc('day', now()) + interval '3 days','urgent','todo',180),
    (uid,c3,'Review organizational behavior lecture notes (Demo)','reading', date_trunc('day', now()) + interval '1 day','medium','todo',60);
  INSERT INTO tasks(user_id,course_id,exam_id,title,task_type,due_at,priority,status,estimated_duration_minutes) VALUES
    (uid,c1,e1,'Practice test for midterm (Demo)','exam_prep', date_trunc('day', now()) + interval '8 days','high','todo',90);
END $$;
GRANT EXECUTE ON FUNCTION public.load_demo_data() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.load_demo_data() FROM anon, public;