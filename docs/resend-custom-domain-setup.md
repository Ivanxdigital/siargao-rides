# Resend Custom Domain Setup

This guide explains how Resend is configured to send emails using your custom domain (siargaorides.ph).

## Current Status

✅ Domain verified: siargaorides.ph is verified in Resend
✅ Custom email configured: support@siargaorides.ph is set up as the sender
✅ Code updated: All email sending code uses the custom domain

## Prerequisites (Completed)

- You have set up your custom email (support@siargaorides.ph) with Zoho Mail
- You have access to your domain's DNS settings at dot.ph
- You have a Resend account with API access
- Your domain is verified in Resend

## DNS Records for Resend (Completed)

The following DNS records have been added to your dot.ph domain:

1. **SPF Record**:
   - Type: TXT
   - Host/Name: @
   - Value: `v=spf1 include:spf.resend.com -all`

2. **DKIM Record**:
   - Type: TXT
   - Host/Name: `resend._domainkey`
   - Value: (The DKIM value provided by Resend)

3. **DMARC Record**:
   - Type: TXT
   - Host/Name: `_dmarc`
   - Value: `v=DMARC1; p=none; rua=mailto:support@siargaorides.ph`

## Domain Verification (Completed)

Your domain has been successfully verified in Resend. This allows you to:

1. Send emails from any address at your domain (e.g., support@siargaorides.ph)
2. Send emails to any recipient (not just your own email)
3. Improve email deliverability with proper authentication

## Application Code (Updated)

Your application code has been updated to use `support@siargaorides.ph` as the sender email. These emails are now properly authenticated with your domain.

## Testing Your Setup (Completed)

✅ Test emails have been sent through your application
✅ Emails are being sent through Resend with proper authentication
✅ The "From" address shows as `Siargao Rides <support@siargaorides.ph>`

## Troubleshooting

If you encounter any email delivery issues:

1. Check the Resend dashboard for delivery logs and any errors
2. Verify that recipients aren't marking your emails as spam
3. Ensure your Resend API key is correctly set in your environment variables
4. Monitor your email reputation through Resend's analytics

## Important Notes

- Replies to automated emails will go to your Zoho Mail inbox at support@siargaorides.ph
- This setup uses Resend's reliable delivery infrastructure while maintaining your professional email address
- Your domain is properly configured to work with both Zoho Mail and Resend
