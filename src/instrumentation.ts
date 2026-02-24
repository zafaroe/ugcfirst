/**
 * Next.js Instrumentation - Server Startup Initialization
 *
 * This file runs once when the Next.js server starts.
 * We use it to pre-warm connections and reduce cold start latency.
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing server...');

    // Pre-warm Supabase clients
    try {
      const { getAdminClient, getAuthClient } = await import('@/lib/supabase');

      // Initialize admin client (used for database operations)
      getAdminClient();
      console.log('[Instrumentation] Supabase admin client initialized');

      // Initialize auth client (used for token verification)
      getAuthClient();
      console.log('[Instrumentation] Supabase auth client initialized');
    } catch (error) {
      console.error('[Instrumentation] Failed to initialize Supabase clients:', error);
    }

    // Pre-warm R2 client
    try {
      const { getR2Client } = await import('@/lib/r2');
      getR2Client();
      console.log('[Instrumentation] R2 client initialized');
    } catch (error) {
      console.error('[Instrumentation] Failed to initialize R2 client:', error);
    }

    console.log('[Instrumentation] Server initialization complete');
  }
}
