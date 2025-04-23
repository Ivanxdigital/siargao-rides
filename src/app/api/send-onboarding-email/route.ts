import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Resend } from 'resend';
import { ShopOwnerOnboardingEmail } from '@/emails';
import { supabaseAdmin } from '@/lib/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Siargao Rides <no-reply@siargaorides.com>',
      to: email,
      subject: 'Welcome to Siargao Rides - Complete Your Shop Registration',
      react: ShopOwnerOnboardingEmail({ user: { firstName: firstName || '', email } }),
    });
    
    if (error) {
      console.error('Failed to send onboarding email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
    
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
      }
    } catch (dbError) {
      // Log but don't fail the request if we can't update the user record
      console.error('Failed to update user record:', dbError);
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in onboarding email API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 