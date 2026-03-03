-- ============================================
-- GRANT 10 FREE CREDITS ON SIGNUP
-- Updates handle_new_user() trigger to grant welcome bonus
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user credits with 10 free welcome credits
  INSERT INTO public.user_credits (user_id, balance, held, lifetime_purchased)
  VALUES (NEW.id, 10, 0, 10);

  -- Record the welcome bonus transaction for audit trail
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
