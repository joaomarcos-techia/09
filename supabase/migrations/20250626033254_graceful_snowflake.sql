-- Create required enums if they don't exist
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stripe_subscription_status AS ENUM (
        'active', 'canceled', 'incomplete', 'incomplete_expired', 
        'not_started', 'past_due', 'paused', 'trialing', 'unpaid'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stripe_order_status AS ENUM ('pending', 'completed', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing is_admin function to avoid conflicts
DROP FUNCTION IF EXISTS public.is_admin();

-- Create helper function for admin checks with proper signature
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  );
EXCEPTION
  WHEN undefined_table THEN
    -- If admin_users table doesn't exist, return false
    RETURN false;
END;
$$;

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'checking',
  balance decimal(12,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type transaction_type NOT NULL,
  color text DEFAULT '#6B7280',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount decimal(12,2) NOT NULL,
  description text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring boolean DEFAULT false,
  recurring_interval text,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stripe_customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_customers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  customer_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create stripe_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id text NOT NULL UNIQUE,
  subscription_id text,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  status stripe_subscription_status NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create stripe_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_orders (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  checkout_session_id text NOT NULL,
  payment_intent_id text NOT NULL,
  customer_id text NOT NULL,
  amount_subtotal bigint NOT NULL,
  amount_total bigint NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  status stripe_order_status DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON stripe_customers;
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;

-- Create comprehensive RLS policies for accounts
CREATE POLICY "Users can manage their own accounts"
  ON accounts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for categories
CREATE POLICY "Users can manage their own categories"
  ON categories FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for transactions
CREATE POLICY "Users can manage their own transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for stripe_customers
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Only create admin policy if admin_users table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Admins can view all customers"
      ON stripe_customers FOR SELECT
      TO authenticated
      USING (public.is_admin())';
  END IF;
END $$;

-- Create RLS policies for stripe_subscriptions
CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- Only create admin policy if admin_users table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Admins can view all subscriptions"
      ON stripe_subscriptions FOR SELECT
      TO authenticated
      USING (public.is_admin())';
  END IF;
END $$;

-- Create RLS policies for stripe_orders
CREATE POLICY "Users can view their own order data"
  ON stripe_orders FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Create update triggers
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop existing views to recreate them
DROP VIEW IF EXISTS stripe_user_subscriptions;
DROP VIEW IF EXISTS stripe_user_orders;

-- Create views for easier access to Stripe data
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status as subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.user_id = auth.uid() 
  AND sc.deleted_at IS NULL 
  AND (ss.deleted_at IS NULL OR ss.id IS NULL);

CREATE VIEW stripe_user_orders WITH (security_invoker = true) AS
SELECT 
  sc.customer_id,
  so.id as order_id,
  so.checkout_session_id,
  so.payment_intent_id,
  so.amount_subtotal,
  so.amount_total,
  so.currency,
  so.payment_status,
  so.status as order_status,
  so.created_at as order_date
FROM stripe_customers sc
LEFT JOIN stripe_orders so ON sc.customer_id = so.customer_id
WHERE sc.user_id = auth.uid() 
  AND sc.deleted_at IS NULL 
  AND (so.deleted_at IS NULL OR so.id IS NULL);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;
GRANT SELECT ON stripe_customers TO authenticated;
GRANT SELECT ON stripe_subscriptions TO authenticated;
GRANT SELECT ON stripe_orders TO authenticated;
GRANT SELECT ON stripe_user_subscriptions TO authenticated;
GRANT SELECT ON stripe_user_orders TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create default categories for existing users who don't have any
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Create default account if user doesn't have any
    IF NOT EXISTS (SELECT 1 FROM accounts WHERE user_id = user_record.id) THEN
      INSERT INTO accounts (user_id, name, type, balance) 
      VALUES (user_record.id, 'Conta Principal', 'checking', 0);
    END IF;
    
    -- Create default categories if user doesn't have any
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = user_record.id) THEN
      INSERT INTO categories (user_id, name, type, is_default) VALUES
      (user_record.id, 'Vendas', 'income', true),
      (user_record.id, 'Serviços', 'income', true),
      (user_record.id, 'Marketing', 'expense', true),
      (user_record.id, 'Operacional', 'expense', true);
    END IF;
  END LOOP;
END $$;