import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lxwnlwjauhpgigvgykbb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4d25sd2phdWhwZ2lndmd5a2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA1NjA1NCwiZXhwIjoyMDg3NjMyMDU0fQ.2-uE1DLqxe2A3ySqeFW-XUyh1mwE7fahoSMwR_mSXBw'
);

async function upgradeUser() {
  // First find the user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }

  const user = users.users.find(u => u.email === 'test-pro@ugcfirst.com');

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Found user:', user.id, user.email);

  // Check current credits
  const { data: currentCredits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', user.id)
    .single();

  console.log('Current credits:', currentCredits);

  // Update user_credits to pro tier
  const { data, error } = await supabase
    .from('user_credits')
    .update({
      subscription_tier: 'pro',
      balance: 100  // Give some credits for testing
    })
    .eq('user_id', user.id)
    .select();

  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Updated to Pro:', data);
  }
}

upgradeUser();
