import { inngest } from '../client';
import { getAdminClient } from '@/lib/supabase';
import { sendWaitlistDay3, sendWaitlistDay7 } from '@/lib/email';

/**
 * Waitlist Nurture Cron Job
 *
 * Runs daily at 2 PM UTC (10 AM ET) to send:
 * - Day 3 emails: Founder story (signed up 3-4 days ago)
 * - Day 7 emails: Early access preview (signed up 7-8 days ago)
 *
 * Launch Day emails are sent manually via /api/waitlist/send-launch
 */
export const waitlistNurture = inngest.createFunction(
  {
    id: 'waitlist-nurture-cron',
    name: 'Waitlist Nurture Email Cron',
    retries: 2,
  },
  { cron: '0 14 * * *' }, // Runs daily at 2 PM UTC (10 AM ET)
  async ({ step }) => {
    const supabase = getAdminClient();

    // Step 1: Send Day 3 emails
    const day3Results = await step.run('send-day3-emails', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      // Find people who signed up 3-4 days ago and haven't received day3 email
      const { data: recipients, error } = await supabase
        .from('waitlist')
        .select('id, email')
        .gte('created_at', fourDaysAgo.toISOString())
        .lt('created_at', threeDaysAgo.toISOString())
        .is('day3_sent_at', null)
        .limit(50); // Batch limit to stay within Resend rate limits

      if (error) {
        console.error('[Waitlist Nurture] Day 3 query error:', error);
        return { sent: 0, errors: 1 };
      }

      if (!recipients?.length) {
        console.log('[Waitlist Nurture] No Day 3 recipients found');
        return { sent: 0, errors: 0 };
      }

      console.log(`[Waitlist Nurture] Sending Day 3 emails to ${recipients.length} recipients`);

      let sent = 0;
      for (const recipient of recipients) {
        try {
          await sendWaitlistDay3(recipient.email);
          await supabase
            .from('waitlist')
            .update({ day3_sent_at: new Date().toISOString() })
            .eq('id', recipient.id);
          sent++;
        } catch (err) {
          console.error(`[Waitlist Nurture] Day 3 failed for ${recipient.email}:`, err);
        }
      }

      return { sent, total: recipients.length };
    });

    // Step 2: Send Day 7 emails
    const day7Results = await step.run('send-day7-emails', async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const { data: recipients, error } = await supabase
        .from('waitlist')
        .select('id, email')
        .gte('created_at', eightDaysAgo.toISOString())
        .lt('created_at', sevenDaysAgo.toISOString())
        .is('day7_sent_at', null)
        .limit(50);

      if (error) {
        console.error('[Waitlist Nurture] Day 7 query error:', error);
        return { sent: 0, errors: 1 };
      }

      if (!recipients?.length) {
        console.log('[Waitlist Nurture] No Day 7 recipients found');
        return { sent: 0, errors: 0 };
      }

      console.log(`[Waitlist Nurture] Sending Day 7 emails to ${recipients.length} recipients`);

      let sent = 0;
      for (const recipient of recipients) {
        try {
          await sendWaitlistDay7(recipient.email);
          await supabase
            .from('waitlist')
            .update({ day7_sent_at: new Date().toISOString() })
            .eq('id', recipient.id);
          sent++;
        } catch (err) {
          console.error(`[Waitlist Nurture] Day 7 failed for ${recipient.email}:`, err);
        }
      }

      return { sent, total: recipients.length };
    });

    console.log('[Waitlist Nurture] Cron complete:', { day3: day3Results, day7: day7Results });

    return {
      day3: day3Results,
      day7: day7Results,
    };
  }
);

export const waitlistNurtureFunctions = [waitlistNurture];
