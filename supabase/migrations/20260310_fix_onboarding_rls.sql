-- Allow users to update their own onboarding_completed flag
-- This was missing, causing the complete-step update to silently fail
CREATE POLICY "Users can update own onboarding flag" ON user_credits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
