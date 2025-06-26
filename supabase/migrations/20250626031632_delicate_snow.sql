/*
  # Create Transactions Table and Related Tables

  1. New Tables
    - `transactions` - Financial transactions
    - `accounts` - Financial accounts
    - `categories` - Transaction categories

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data

  3. Indexes
    - Add indexes for better performance
*/

-- Create transaction_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts
DO $$ BEGIN
    CREATE POLICY "Users can manage their own accounts"
      ON accounts FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RLS policies for categories
DO $$ BEGIN
    CREATE POLICY "Users can manage their own categories"
      ON categories FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RLS policies for transactions
DO $$ BEGIN
    CREATE POLICY "Users can manage their own transactions"
      ON transactions FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default income categories
  INSERT INTO categories (user_id, name, type, color, is_default)
  VALUES
    (NEW.id, 'Vendas', 'income', '#10B981', true),
    (NEW.id, 'Serviços', 'income', '#059669', true),
    (NEW.id, 'Investimentos', 'income', '#047857', true),
    (NEW.id, 'Outros', 'income', '#065F46', true);

  -- Insert default expense categories
  INSERT INTO categories (user_id, name, type, color, is_default)
  VALUES
    (NEW.id, 'Marketing', 'expense', '#EF4444', true),
    (NEW.id, 'Operacional', 'expense', '#DC2626', true),
    (NEW.id, 'Pessoal', 'expense', '#B91C1C', true),
    (NEW.id, 'Impostos', 'expense', '#991B1B', true),
    (NEW.id, 'Outros', 'expense', '#7F1D1D', true);

  -- Create default account
  INSERT INTO accounts (user_id, name, type, balance)
  VALUES (NEW.id, 'Conta Principal', 'checking', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_user_created_add_financial_defaults ON auth.users;
CREATE TRIGGER on_user_created_add_financial_defaults
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories_for_user();