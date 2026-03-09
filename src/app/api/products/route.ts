import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';

// GET /api/products — List user's saved products
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) return unauthorizedResponse(authError || 'Unauthorized');

    const supabase = getAdminClient();
    const { data: products, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ success: true, products: products || [] });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products — Save a new product
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) return unauthorizedResponse(authError || 'Unauthorized');

    const body = await request.json();
    const { name, description, imageUrl, images, price, features, source, sourceUrl, persona } = body;

    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: 'name and imageUrl are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check for duplicate (same name + same user)
    const { data: existing } = await supabase
      .from('user_products')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      // Update existing product instead of creating duplicate
      const { data: updated, error: updateError } = await supabase
        .from('user_products')
        .update({
          description,
          image_url: imageUrl,
          images: images || [],
          price,
          features: features || [],
          source: source || 'manual',
          source_url: sourceUrl,
          ...(persona !== undefined && { persona_profile: persona }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
      }

      return NextResponse.json({ success: true, product: updated, updated: true });
    }

    // Create new product
    const { data: product, error: insertError } = await supabase
      .from('user_products')
      .insert({
        user_id: user.id,
        name,
        description,
        image_url: imageUrl,
        images: images || [],
        price,
        features: features || [],
        source: source || 'manual',
        source_url: sourceUrl,
        persona_profile: persona || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving product:', insertError);
      return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/products — Update persona on existing product
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) return unauthorizedResponse(authError || 'Unauthorized');

    const body = await request.json();
    const { productId, persona } = body;

    if (!productId || !persona) {
      return NextResponse.json(
        { error: 'productId and persona are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { error: updateError } = await supabase
      .from('user_products')
      .update({
        persona_profile: persona,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating persona:', updateError);
      return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
