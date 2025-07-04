import { NextRequest, NextResponse } from 'next/server';
import { createPaymentMethod } from '@/lib/paymongo';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { 
      type, 
      details, 
      billing 
    } = await request.json();

    // Validate input
    if (!type || (type === 'card' && !details)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment method with PayMongo
    const paymentMethod = await createPaymentMethod(
      type,
      details,
      billing
    );

    return NextResponse.json({
      success: true,
      payment_method: paymentMethod
    });
  } catch (error: unknown) {
    console.error('Error in create-method API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
