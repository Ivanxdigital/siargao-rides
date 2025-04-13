# Setting Up Resend with Your Custom Domain

This guide explains how to configure Resend to send emails using your custom domain (siargaorides.ph).

## Prerequisites

- You have already set up your custom email (support@siargaorides.ph) with Zoho Mail
- You have access to your domain's DNS settings at dot.ph
- You have a Resend account with API access

## Step 1: Add Your Domain to Resend

1. Log in to your [Resend Dashboard](https://resend.com/domains)
2. Click on "Add Domain"
3. Enter your domain name: `siargaorides.ph`
4. Follow the verification process

## Step 2: Add DNS Records for Resend

You'll need to add the following DNS records to your dot.ph domain:

1. **SPF Record**:
   - Type: TXT
   - Host/Name: @
   - Value: `v=spf1 include:spf.resend.com -all`
   - TTL: Auto/3600

2. **DKIM Record**:
   - Type: TXT
   - Host/Name: `resend._domainkey` (or as specified by Resend)
   - Value: (The DKIM value provided by Resend)
   - TTL: Auto/3600

3. **DMARC Record**:
   - Type: TXT
   - Host/Name: `_dmarc`
   - Value: `v=DMARC1; p=none; rua=mailto:support@siargaorides.ph`
   - TTL: Auto/3600

## Step 3: Verify Domain in Resend

1. After adding the DNS records, go back to Resend
2. Click "Verify DNS" to confirm your domain setup
3. Wait for verification to complete (may take up to 24-48 hours for DNS propagation)

## Step 4: Update Your Application Code

You've already updated your application code to use `support@siargaorides.ph` as the sender email. Once your domain is verified in Resend, these emails will be properly authenticated.

## Testing Your Setup

1. After domain verification is complete, send a test email through your application
2. Check the email headers to verify it's being sent through Resend with proper authentication
3. Verify that the "From" address shows as `Siargao Rides <support@siargaorides.ph>`

## Troubleshooting

If emails aren't being delivered properly:

1. Check that all DNS records are correctly set up
2. Verify that your domain is showing as "Verified" in Resend
3. Ensure your Resend API key is correctly set in your environment variables
4. Check Resend logs for any delivery issues

## Important Notes

- You can use Resend to send emails "from" your Zoho Mail address, but replies will still go to your Zoho Mail inbox
- This setup allows you to use Resend's reliable delivery infrastructure while maintaining your professional email address
- Make sure your SPF records don't conflict if you're using both Zoho Mail and Resend with the same domain
