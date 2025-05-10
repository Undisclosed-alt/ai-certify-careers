
-- Begin transaction
BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create job_roles table
CREATE TABLE public.job_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_role_id UUID NOT NULL REFERENCES public.job_roles(id),
  time_limit_minutes INTEGER NOT NULL DEFAULT 60,
  passing_score INTEGER NOT NULL DEFAULT 70,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(id),
  type TEXT NOT NULL,
  body TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  category TEXT,
  difficulty INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create attempts table
CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  exam_id UUID NOT NULL REFERENCES public.exams(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score_json JSONB,
  answers_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  rank TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.attempts(id),
  sha256_hash TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prompt_logs table
CREATE TABLE public.prompt_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX ON public.attempts (user_id);
CREATE INDEX ON public.attempts (exam_id);
CREATE INDEX ON public.questions (exam_id);
CREATE INDEX ON public.exams (job_role_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true);

-- Create handle_new_user function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_logs ENABLE ROW LEVEL SECURITY;

-- Create is_admin helper function to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
END;
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for job_roles
CREATE POLICY "Anyone can view job roles"
  ON public.job_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert job roles"
  ON public.job_roles
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update job roles"
  ON public.job_roles
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete job roles"
  ON public.job_roles
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for exams
CREATE POLICY "Anyone can view exams"
  ON public.exams
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert exams"
  ON public.exams
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update exams"
  ON public.exams
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete exams"
  ON public.exams
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for questions
CREATE POLICY "Anyone can view questions"
  ON public.questions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert questions"
  ON public.questions
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update questions"
  ON public.questions
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete questions"
  ON public.questions
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for attempts
CREATE POLICY "Users can view their own attempts"
  ON public.attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts"
  ON public.attempts
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own attempts"
  ON public.attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts"
  ON public.attempts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all attempts"
  ON public.attempts
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for certificates
CREATE POLICY "Users can view their own certificates"
  ON public.certificates
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.attempts
    WHERE attempts.id = certificates.attempt_id
    AND attempts.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all certificates"
  ON public.certificates
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert certificates for their own attempts"
  ON public.certificates
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.attempts
    WHERE attempts.id = certificates.attempt_id
    AND attempts.user_id = auth.uid()
  ));

CREATE POLICY "Admins can insert all certificates"
  ON public.certificates
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Create RLS policies for storage.objects
CREATE POLICY "Users can insert their own certificate files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates' AND
    (name LIKE auth.uid() || '/%')
  );

CREATE POLICY "Users can select their own certificate files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certificates' AND
    (name LIKE auth.uid() || '/%')
  );

CREATE POLICY "Public can access certificate files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'certificates');

-- Create RLS policies for prompt_logs
CREATE POLICY "Admins can view prompt logs"
  ON public.prompt_logs
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert prompt logs"
  ON public.prompt_logs
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed data: Job Roles
INSERT INTO public.job_roles (id, title, slug, description, price_cents, image_url, level)
VALUES 
  (
    '2f9e97a0-5d9d-4c8a-9c3b-71a3b0d8e6f0',
    'Junior Frontend Developer',
    'junior-frontend-developer',
    'Entry-level position focused on implementing user interfaces using HTML, CSS, and JavaScript frameworks like React.',
    2999,
    'https://images.unsplash.com/photo-1593720213428-28a5b9e94613',
    'Junior'
  ),
  (
    'c8d2a7e6-1b3f-4f9a-8e7d-5c4b3a2f1d0e',
    'Junior Backend Developer',
    'junior-backend-developer',
    'Entry-level position focused on server-side logic, databases, and API development using Node.js, Python, or other backend technologies.',
    2999,
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    'Junior'
  );

-- Seed data: Exams
INSERT INTO public.exams (id, job_role_id, time_limit_minutes, passing_score, version)
VALUES 
  (
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a',
    '2f9e97a0-5d9d-4c8a-9c3b-71a3b0d8e6f0',
    90,
    70,
    1
  ),
  (
    'f6e5d4c3-b2a1-4c5d-8e7f-9a8b7c6d5e4',
    'c8d2a7e6-1b3f-4f9a-8e7d-5c4b3a2f1d0e',
    90,
    70,
    1
  );

-- Seed data: Questions for Frontend Developer Exam
INSERT INTO public.questions (exam_id, type, body, options, correct_answer, category, difficulty)
VALUES
  (
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a',
    'multiple_choice',
    'Which CSS property is used to control the spacing between elements?',
    '[
      {"id": "a", "text": "margin"},
      {"id": "b", "text": "padding"},
      {"id": "c", "text": "spacing"},
      {"id": "d", "text": "gap"}
    ]',
    'd',
    'CSS',
    1
  ),
  (
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a',
    'coding',
    'Write a React component that displays a button which, when clicked, increments a counter.',
    NULL,
    'function Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}',
    'React',
    2
  ),
  (
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a',
    'multiple_choice',
    'What does the "useEffect" hook do in React?',
    '[
      {"id": "a", "text": "Manages component state"},
      {"id": "b", "text": "Performs side effects in function components"},
      {"id": "c", "text": "Creates custom hooks"},
      {"id": "d", "text": "Optimizes component rendering"}
    ]',
    'b',
    'React',
    2
  ),
  (
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a',
    'free_text',
    'Explain the concept of "responsive design" and list at least two techniques used to implement it.',
    NULL,
    'Responsive design is an approach to web design that makes web pages render well on a variety of devices and window or screen sizes. Techniques include: media queries, flexible grid layouts, flexible images and media, and CSS frameworks like Bootstrap.',
    'Web Design',
    2
  );

-- Seed data: Questions for Backend Developer Exam
INSERT INTO public.questions (exam_id, type, body, options, correct_answer, category, difficulty)
VALUES
  (
    'f6e5d4c3-b2a1-4c5d-8e7f-9a8b7c6d5e4',
    'multiple_choice',
    'Which HTTP status code indicates a successful request?',
    '[
      {"id": "a", "text": "200"},
      {"id": "b", "text": "404"},
      {"id": "c", "text": "500"},
      {"id": "d", "text": "302"}
    ]',
    'a',
    'HTTP',
    1
  ),
  (
    'f6e5d4c3-b2a1-4c5d-8e7f-9a8b7c6d5e4',
    'coding',
    'Write a Node.js function that connects to a MongoDB database and retrieves all documents from a collection called "users".',
    NULL,
    'async function getUsers() {\n  const { MongoClient } = require(\'mongodb\');\n  const uri = process.env.MONGODB_URI;\n  const client = new MongoClient(uri);\n  \n  try {\n    await client.connect();\n    const database = client.db(\'mydb\');\n    const users = database.collection(\'users\');\n    return await users.find({}).toArray();\n  } finally {\n    await client.close();\n  }\n}',
    'Node.js',
    2
  ),
  (
    'f6e5d4c3-b2a1-4c5d-8e7f-9a8b7c6d5e4',
    'multiple_choice',
    'What is SQL injection and how can it be prevented?',
    '[
      {"id": "a", "text": "A type of network attack; prevented by using firewalls"},
      {"id": "b", "text": "A code injection technique; prevented by using parameterized queries"},
      {"id": "c", "text": "A hardware vulnerability; prevented by updating firmware"},
      {"id": "d", "text": "A denial of service attack; prevented by rate limiting"}
    ]',
    'b',
    'Security',
    2
  ),
  (
    'f6e5d4c3-b2a1-4c5d-8e7f-9a8b7c6d5e4',
    'free_text',
    'Explain the differences between REST and GraphQL APIs, and provide a use case where one might be preferred over the other.',
    NULL,
    'REST APIs use standard HTTP methods and expose fixed-structure endpoints, while GraphQL provides a flexible query language allowing clients to request exactly the data they need. REST might be preferred for simple CRUD operations with predictable data needs, while GraphQL excels when clients need to fetch related data efficiently or when bandwidth optimization is critical, such as in mobile applications.',
    'API Design',
    3
  );

-- Commit the transaction
COMMIT;
