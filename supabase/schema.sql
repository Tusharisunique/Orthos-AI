

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  tags text,
  embedding double precision[],
  x double precision,
  y double precision,
  z double precision,
  quadrant text,
  cluster_id text,
  axes_used jsonb,
  semantic_tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ai_requests (
  id bigserial primary key,
  created_at timestamptz default now(),
  request_type text,
  model text,
  provider text,
  status text,
  latency_ms integer,
  input_chars integer,
  compute_location text,
  error text,
  details jsonb
);

create table if not exists public.compute_jobs (
  id bigserial primary key,
  created_at timestamptz default now(),
  job_type text not null,
  status text not null,
  compute_location text,
  details jsonb
);

create table if not exists public.logs (
  id bigserial primary key,
  created_at timestamptz default now(),
  level text,
  scope text,
  path text,
  method text,
  status_code integer,
  message text,
  details jsonb
);


alter table public.products enable row level security;
alter table public.ai_requests enable row level security;
alter table public.compute_jobs enable row level security;
alter table public.logs enable row level security;


create policy "products_read_authenticated"
  on public.products
  for select
  to authenticated
  using (true);


create policy "ai_requests_no_client_access"
  on public.ai_requests
  for all
  to authenticated
  using (false)
  with check (false);

create policy "compute_jobs_no_client_access"
  on public.compute_jobs
  for all
  to authenticated
  using (false)
  with check (false);

create policy "logs_no_client_access"
  on public.logs
  for all
  to authenticated
  using (false)
  with check (false);
