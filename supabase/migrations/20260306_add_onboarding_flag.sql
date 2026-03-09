-- Add onboarding tracking to user_credits
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Update the handle_new_user trigger to include the new column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, held, lifetime_purchased, onboarding_completed)
  VALUES (NEW.id, 10, 0, 10, false);

  INSERT INTO public.credit_transactions (
    user_id, type, amount, balance_before, balance_after,
    description, status
  ) VALUES (
    NEW.id, 'bonus', 10, 0, 10,
    'Welcome bonus - 10 free credits', 'completed'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON COLUMN public.user_credits.onboarding_completed IS 'Whether the user has completed the onboarding flow';
