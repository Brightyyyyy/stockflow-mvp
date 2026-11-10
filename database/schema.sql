create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  organization_id uuid not null references organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sku text not null,
  description text,
  quantity integer not null default 0,
  cost_price numeric(12,2),
  selling_price numeric(12,2),
  low_stock_threshold integer,
  last_updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);

create index idx_products_org on products(organization_id);

alter table organizations enable row level security;
alter table users enable row level security;
alter table products enable row level security;