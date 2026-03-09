import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';

// POST /api/products/[id]/use — Increment generation_count and update last_used_at
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) return unauthorizedResponse(authError || 'Unauthorized');

    const supabase = getAdminClient();

    // Get current count and increment
    const { data: product, error: fetchError } = await supabase
      .from('user_products')
      .select('generation_count')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('user_products')
      .update({
        generation_count: (product.generation_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating product usage:', updateError);
      return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product usage tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
