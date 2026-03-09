import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { functions as videoFunctions } from '@/inngest/functions/generate-video';
import { scheduleFunctions } from '@/inngest/functions/schedule-post';
import { waitlistNurtureFunctions } from '@/inngest/functions/waitlist-nurture';
import { cleanupFunctions } from '@/inngest/functions/cleanup-stuck-generations';

// ============================================
// INNGEST API ROUTE
// Handles incoming Inngest events and function execution
// ============================================

// Combine all Inngest functions
const allFunctions = [
  ...videoFunctions,
  ...scheduleFunctions,
  ...waitlistNurtureFunctions,
  ...cleanupFunctions,
];

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allFunctions,
});
