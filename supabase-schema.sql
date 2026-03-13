-- Supabase schema for Task Manager
-- Run this in Supabase SQL editor (or via psql) to create required tables + policies.

-- Enable UUID generation extension (required for uuid_generate_v4)
create extension if not exists "uuid-ossp";

-- Tasks table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  assigned_to_email text,
  created_by_email text,
  shared boolean not null default false,
  deadline timestamptz,
  priority text not null default 'medium',
  assignment_status text not null default 'active',
  comments jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Automatically update updated_at on modifications
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
before update on tasks
for each row
execute function set_updated_at();

-- Row level security (RLS) policy for tasks
alter table tasks enable row level security;

create policy "Tasks select" on tasks
  for select using (
    auth.uid() = user_id
    or (
      (auth.jwt() ->> 'email') = assigned_to_email
      and assignment_status = 'active'
    )
  );

create policy "Tasks insert" on tasks
  for insert with check (auth.uid() = user_id);

create policy "Tasks update" on tasks
  for update using (
    auth.uid() = user_id
    or (
      (auth.jwt() ->> 'email') = assigned_to_email
      and assignment_status = 'active'
    )
  )
  with check (
    auth.uid() = user_id
    or (
      (auth.jwt() ->> 'email') = assigned_to_email
      and assignment_status = 'active'
    )
  );

create policy "Tasks delete" on tasks
  for delete using (auth.uid() = user_id);

-- Example: allow reading task comments as JSONB (handled by the same policy above)

-- Add additional tables (if you want) for separate comments or attachments.
-- Example:
-- create table task_comments (
--   id uuid primary key default uuid_generate_v4(),
--   task_id uuid not null references tasks(id) on delete cascade,
--   user_id uuid not null references auth.users(id),
--   content text not null,
--   created_at timestamptz not null default now()
-- );
--
-- alter table task_comments enable row level security;
-- create policy "Users can access their own task comments" on task_comments
--   for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

-- Templates, views, invites, drafts, notifications, attachments
create table if not exists task_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text default 'Custom',
  values jsonb not null,
  shared boolean default false,
  created_at timestamptz default now()
);

create table if not exists task_views (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters jsonb not null,
  created_at timestamptz default now()
);

create table if not exists task_invites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_user_id uuid references auth.users(id) on delete cascade,
  from_email text,
  to_email text not null,
  email text not null,
  invite_type text default 'collaboration',
  task_id uuid references tasks(id) on delete cascade,
  task_title text,
  task_description text,
  task_priority text,
  task_deadline timestamptz,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists task_drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  draft jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists task_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  action_link text,
  action_label text,
  task_id uuid references tasks(id) on delete set null,
  time timestamptz default now(),
  read boolean default false
);

create table if not exists task_activity (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  actor_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists task_attachments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  name text not null,
  type text,
  size int,
  path text not null,
  url text,
  created_at timestamptz default now()
);

alter table task_templates enable row level security;
alter table task_views enable row level security;
alter table task_invites enable row level security;
alter table task_drafts enable row level security;
alter table task_notifications enable row level security;
alter table task_attachments enable row level security;
alter table task_activity enable row level security;

create policy "User templates read" on task_templates
  for select using (auth.uid() = user_id or shared = true);
create policy "User templates manage" on task_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "User views manage" on task_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Invites read" on task_invites
  for select using (
    auth.uid() = from_user_id
    or (auth.jwt() ->> 'email') = to_email
  );

create policy "Invites send" on task_invites
  for insert with check (auth.uid() = from_user_id);

create policy "Invites respond" on task_invites
  for update using ((auth.jwt() ->> 'email') = to_email)
  with check ((auth.jwt() ->> 'email') = to_email);

create policy "User drafts manage" on task_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "User notifications manage" on task_notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Assignee notify owner" on task_notifications
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.user_id = task_notifications.user_id
        and (auth.jwt() ->> 'email') = tasks.assigned_to_email
        and tasks.assignment_status = 'active'
    )
  );

create policy "Task attachments access" on task_attachments
  for all using (
    exists (select 1 from tasks where tasks.id = task_id and tasks.user_id = auth.uid())
  )
  with check (
    exists (select 1 from tasks where tasks.id = task_id and tasks.user_id = auth.uid())
  );

create policy "Task activity read" on task_activity
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = task_activity.task_id
        and (
          tasks.user_id = auth.uid()
          or (
            (auth.jwt() ->> 'email') = tasks.assigned_to_email
            and tasks.assignment_status = 'active'
          )
        )
    )
  );

create policy "Task activity write" on task_activity
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = task_activity.task_id
        and (
          tasks.user_id = auth.uid()
          or (
            (auth.jwt() ->> 'email') = tasks.assigned_to_email
            and tasks.assignment_status = 'active'
          )
        )
    )
  );

-- Storage bucket for attachments
insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', true)
on conflict do nothing;

-- Storage policies for task-files bucket (public read, owner write)
create policy "Public read task files" on storage.objects
  for select using (bucket_id = 'task-files');

create policy "User write task files" on storage.objects
  for insert with check (bucket_id = 'task-files' and auth.uid() = owner);

create policy "User delete task files" on storage.objects
  for delete using (bucket_id = 'task-files' and auth.uid() = owner);
