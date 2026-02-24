import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { functions as videoFunctions } from '@/inngest/functions/generate-video';
import { scheduleFunctions } from '@/inngest/functions/schedule-post';

// ============================================
// INNGEST API ROUTE
// Handles incoming Inngest events and function execution
// ============================================

// Combine all Inngest functions
const allFunctions = [...videoFunctions, ...scheduleFunctions];

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allFunctions,
});
