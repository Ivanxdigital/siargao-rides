import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Resend } from 'resend';
import { ShopOwnerOnboardingEmail } from '@/emails';
import { supabaseAdmin } from '@/lib/admin';
import { v4 as uuid } from 'uuid';

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;
const isDevMode = process.env.NODE_ENV === 'development';

// Log the presence of the API key (without revealing it)
console.log('Resend API key status:', resendApiKey ?
  `Present (starts with ${resendApiKey.substring(0, 3)}...)` :
  'MISSING - emails will fail');
console.log('Environment:', isDevMode ? 'Development' : 'Production');

// Only initialize Resend if API key is available
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    console.log(`Attempting to send onboarding email to: ${email}`);
    
    // Check if Resend is properly initialized
    if (!resend) {
      console.error('Failed to send onboarding email: Resend API key is missing');
      return NextResponse.json({ 
        error: 'Email service not configured', 
        details: 'RESEND_API_KEY environment variable is missing' 
      }, { status: 500 });
    }
    
    // Send email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: 'Siargao Rides <support@siargaorides.ph>',
        to: email,
        subject: 'Welcome to Siargao Rides - Complete Your Shop Registration',
        headers: {
          'X-Entity-Ref-ID': uuid(),
        },
        react: ShopOwnerOnboardingEmail({ user: { firstName: firstName || '', email } }),
      });
      
      if (error) {
        console.error('Resend API error:', error);
        return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 });
      }
      
      console.log('Onboarding email sent successfully:', data);
      
      // Try to update the user record if we have authentication
      try {
        // Get the current user session
        const supabase = createServerComponentClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Update the user record using admin client for more privileges
          await supabaseAdmin
            .from('users')
            .update({ onboarding_email_sent: true })
            .eq('email', email);
            
          console.log('User record updated with onboarding_email_sent=true');
        }
      } catch (dbError) {
        // Log but don't fail the request if we can't update the user record
        console.error('Failed to update user record:', dbError);
      }
      
      return NextResponse.json({ success: true, data });
    } catch (sendError) {
      console.error('Error sending email with Resend:', sendError);
      let errorMessage = 'Unknown error';
      if (sendError instanceof Error) {
        errorMessage = sendError.message;
        console.error('Error details:', { name: sendError.name, message: sendError.message, stack: sendError.stack });
      } else {
        console.error('Error details (non-Error object):', JSON.stringify(sendError, null, 2));
      }
      
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: errorMessage 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in onboarding email API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 