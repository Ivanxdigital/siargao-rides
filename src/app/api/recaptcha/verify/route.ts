import { NextResponse } from 'next/server';

export async function POST() {
  // Always return a successful verification
  return NextResponse.json({
    success: true,
    isHuman: true,
    score: 0.9,
    action: 'register_shop',
    bypass_mode: true
  });
}
