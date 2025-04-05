import * as React from 'react';

interface EmailTemplateProps {
  name: string;
  email: string;
  message: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  name,
  email,
  message,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px' }}>
    <h1 style={{ color: '#0070f3', marginBottom: '16px' }}>New Contact Form Submission</h1>
    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f7f7f7', borderRadius: '4px' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>From: {name}</h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>Email: {email}</p>
      <div style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Message:</h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{message}</p>
      </div>
    </div>
    <div style={{ fontSize: '12px', color: '#999', marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
      <p>This email was sent from the Siargao Rides contact form.</p>
    </div>
  </div>
); 