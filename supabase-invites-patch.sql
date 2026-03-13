-- Patch: invitation/assignment workflow + task assignment status

alter table task_invites
  add column if not exists invite_type text default 'collaboration',
  add column if not exists task_id uuid references tasks(id) on delete cascade,
  add column if not exists from_user_id uuid references auth.users(id),
  add column if not exists from_email text,
  add column if not exists to_email text,
  add column if not exists task_title text,
  add column if not exists task_description text,
  add column if not exists task_priority text,
  add column if not exists task_deadline timestamptz;

update task_invites set from_user_id = user_id where from_user_id is null;
update task_invites set to_email = email where to_email is null;

-- Replace invite policies to allow recipients to see/respond
drop policy if exists "User invites manage" on task_invites;

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

-- Assignment status on tasks: pending/active/declined
alter table tasks add column if not exists assignment_status text default 'active';

-- Replace tasks policy so assignees only see active assignments
drop policy if exists "Users can manage their tasks" on tasks;
drop policy if exists "Tasks select" on tasks;
drop policy if exists "Tasks insert" on tasks;
drop policy if exists "Tasks update" on tasks;
drop policy if exists "Tasks delete" on tasks;

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

-- Activity log for tasks
create table if not exists task_activity (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  actor_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table task_activity enable row level security;

drop policy if exists "Task activity read" on task_activity;
drop policy if exists "Task activity write" on task_activity;

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

-- Allow assignee to notify owner
drop policy if exists "User notifications manage" on task_notifications;

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

-- Notification action fields
alter table task_notifications
  add column if not exists action_link text,
  add column if not exists action_label text,
  add column if not exists task_id uuid references tasks(id) on delete set null;
