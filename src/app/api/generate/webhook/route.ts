import { NextRequest, NextResponse } from 'next/server';
import { KieService } from '@/lib/ai/kie';
import { inngest } from '@/inngest/client';

// ============================================
// POST /api/generate/webhook
// Handle kie.ai video completion webhooks
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generationId');
    const scriptIndex = parseInt(searchParams.get('scriptIndex') || '0', 10);

    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generationId' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature (if secret is configured)
    const signature = request.headers.get('x-kie-signature') || '';
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const isValid = KieService.verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret
      );

      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    const payload = KieService.parseWebhookPayload(rawBody);

    if (payload.status === 'completed' && payload.videoUrl) {
      // Send success event to Inngest
      await inngest.send({
        name: 'webhook/kie-completed',
        data: {
          generationId,
          scriptIndex,
          jobId: payload.jobId,
          videoUrl: payload.videoUrl,
          duration: payload.duration || 5,
        },
      });

      return NextResponse.json({ success: true, status: 'completed' });
    } else if (payload.status === 'failed') {
      // Send failure event to Inngest
      await inngest.send({
        name: 'webhook/kie-failed',
        data: {
          generationId,
          scriptIndex,
          jobId: payload.jobId,
          error: payload.error || 'Video generation failed',
        },
      });

      return NextResponse.json({ success: true, status: 'failed' });
    }

    // Unknown status
    console.warn('Unknown webhook status:', payload.status);
    return NextResponse.json({ success: true, status: 'ignored' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
