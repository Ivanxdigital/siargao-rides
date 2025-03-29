import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const { shopId } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('rental_shops')
      .update({ is_verified: true })
      .eq('id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error verifying shop:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 