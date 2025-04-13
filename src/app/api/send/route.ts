import { EmailTemplate } from '@/components/EmailTemplate';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Define validation schema
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(1, 'Message is required'),
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const result = contactFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.format()
      }, { status: 400 });
    }

    const { name, email, message } = result.data;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Siargao Rides <support@siargaorides.ph>',
      to: 'siargaorides@gmail.com',
      subject: 'New Contact Form Submission',
      replyTo: email,
      headers: {
        'X-Entity-Ref-ID': uuid(), // For tracking/avoiding duplicates
      },
      react: EmailTemplate({ name, email, message }) as React.ReactElement,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      error: 'Failed to process request'
    }, { status: 500 });
  }
}