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

export async function PATCH(request: Request) {
  try {
    const { shopId, approve } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // If rejecting, we'll delete the shop application
    if (approve === false) {
      const { error: deleteError } = await supabaseAdmin
        .from('rental_shops')
        .delete()
        .eq('id', shopId);

      if (deleteError) {
        console.error('Error rejecting shop:', deleteError);
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Shop application rejected' });
    } 
    
    // If approving, update is_verified to true
    const { data, error } = await supabaseAdmin
      .from('rental_shops')
      .update({ is_verified: true })
      .eq('id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error approving shop:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PATCH:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 