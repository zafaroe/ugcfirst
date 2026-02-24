import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function releaseHeld() {
  const userId = '601c75a6-1fa9-4e9b-aceb-f0e7bb2d6718';
  
  // Release held credits
  const { error } = await supabase
    .from('user_credits')
    .update({ held: 0 })
    .eq('user_id', userId);
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Released held credits!');
  }
  
  // Check new balance
  const { data } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  console.log('New balance:', data);
  console.log('Available:', data.balance - data.held);
}

releaseHeld();
