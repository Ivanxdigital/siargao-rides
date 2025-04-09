import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA token is missing' },
        { status: 400 }
      );
    }

    // Check if we're in development mode (localhost)
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         request.headers.get('host')?.includes('localhost') || 
                         request.headers.get('host')?.includes('127.0.0.1');
    
    // In development mode, bypass the actual verification
    if (isDevelopment) {
      return NextResponse.json({
        success: true,
        isHuman: true,
        score: 0.9,
        action: 'register_shop',
        development_mode: true
      });
    }

    // Verify the token with Google's reCAPTCHA API
    const secretKey = '6Ler8w8rAAAAAIYqr2xPzKQduYLL-UcP1t0OzgdC';
    
    // Create a URLSearchParams object for the request body
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);
    
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        body: params,
      }
    );

    const data = await response.json();

    // Check if the verification was successful
    if (data.success) {
      // You can also check the score if needed (for v3)
      // A score closer to 1.0 indicates a good interaction, closer to 0.0 indicates a bot
      const score = data.score;
      const action = data.action;

      // You can decide what score threshold to use
      const isHuman = score >= 0.5;

      return NextResponse.json({
        success: true,
        isHuman,
        score,
        action,
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'reCAPTCHA verification failed',
          errorCodes: data['error-codes'] 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
