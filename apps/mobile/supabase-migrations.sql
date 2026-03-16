-- Supabase Schema pour LBS Covoit

-- 1. Tables principales
create table if not exists users (
  id uuid not null primary key,
  email text not null unique,
  full_name text,
  created_at timestamp with time zone default now(),
  role text default 'user'
);

create table if not exists wallets (
  user_id uuid not null references users(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamp with time zone default now(),
  primary key (user_id)
);

create table if not exists rides (
  id uuid not null primary key default gen_random_uuid(),
  driver_id uuid not null references users(id) on delete cascade,
  zone_id text not null,
  seats_total integer not null,
  seats_available integer not null,
  status text not null default 'open',
  departure_time timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

create table if not exists ride_reservations (
  id uuid not null primary key default gen_random_uuid(),
  ride_id uuid not null references rides(id) on delete cascade,
  driver_id uuid not null references users(id) on delete cascade,
  passenger_id uuid not null references users(id) on delete cascade,
  tokens_held integer not null,
  status text not null default 'held',
  qr_token text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  confirmed_at timestamp with time zone
);

create table if not exists transactions (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  ride_id uuid,
  type text not null,
  status text not null,
  tokens integer not null,
  created_at timestamp with time zone default now()
);

create table if not exists commissions (
  id uuid not null primary key default gen_random_uuid(),
  ride_id uuid references rides(id),
  driver_id uuid references users(id),
  passenger_id uuid references users(id),
  tokens integer not null,
  created_at timestamp with time zone default now()
);

-- 2. Policies
-- Open policy for auth users on their own data

create policy "Users can manage own profile" on users for
  all using (auth.uid() = id);

create policy "Wallet read own" on wallets for
  select using (auth.uid() = user_id);

create policy "rides public read" on rides for
  select using (true);

create policy "rides insert" on rides for
  insert using (auth.uid() = driver_id);

create policy "rides update/delete" on rides for
  update, delete using (auth.uid() = driver_id);

create policy "reservations passenger or driver" on ride_reservations for
  select using (auth.uid() = passenger_id OR auth.uid() = driver_id);

create policy "reservations insert" on ride_reservations for
  insert using (auth.uid() = passenger_id);

create policy "transactions read own" on transactions for
  select using (auth.uid() = user_id);

create policy "commissions restricted" on commissions for
  select using (auth.role() = 'authenticated' AND auth.uid() = driver_id);

-- 3. Functions (RPC)

-- purchase_tokens
create function purchase_tokens(amount int)
returns json as $$
declare
  current_balance int;
  new_balance int;
  userId uuid := auth.uid();
  tx_id uuid;
begin
  if amount < 1 or amount > 500 then
    raise exception 'Achat limite a 500 jetons maximum';
  end if;

  select balance into current_balance from wallets where user_id = userId;
  if not found then
    current_balance := 0;
    insert into wallets(user_id, balance) values (userId, 0);
  end if;

  new_balance := current_balance + amount;
  update wallets set balance = new_balance, updated_at = now() where user_id = userId;

  insert into transactions(id, user_id, type, status, tokens) values (gen_random_uuid(), userId, 'purchase', 'completed', amount);

  return json_build_object('balance', new_balance, 'transaction_id', currval('transactions_id_seq'));
end;
$$ language plpgsql;

-- ... Fonctions reserve_ride, finalize_ride et get_commission_summary a créer en DB.
