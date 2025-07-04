/**
 * PayMongo API Service
 * This service handles all interactions with the PayMongo API
 */

import crypto from 'crypto';

// PayMongo API keys
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY;
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

// Check if API keys are set
if (!PAYMONGO_SECRET_KEY) {
  console.error('PAYMONGO_SECRET_KEY environment variable is not set');
  // Don't throw error to avoid breaking existing functionality
}

if (!PAYMONGO_PUBLIC_KEY) {
  console.error('PAYMONGO_PUBLIC_KEY environment variable is not set');
  // Don't throw error to avoid breaking existing functionality
}

// Log environment variables (without exposing full secret key)
console.log('PayMongo Environment Variables Check:');
console.log('- SECRET_KEY exists:', !!process.env.PAYMONGO_SECRET_KEY);
console.log('- SECRET_KEY prefix:', PAYMONGO_SECRET_KEY.substring(0, 7));
console.log('- PUBLIC_KEY exists:', !!process.env.PAYMONGO_PUBLIC_KEY);
console.log('- PUBLIC_KEY prefix:', PAYMONGO_PUBLIC_KEY.substring(0, 7));
console.log('- API URL:', PAYMONGO_API_URL);

// Helper function to encode API key for Basic Auth
const encodeApiKey = (apiKey: string): string => {
  return Buffer.from(`${apiKey}:`).toString('base64');
};

/**
 * Create a PayMongo Payment Intent
 * @param amount Amount in cents (e.g., 10000 for ₱100.00)
 * @param description Description of the payment
 * @param metadata Additional metadata for the payment
 * @returns Payment Intent object
 */
export const createPaymentIntent = async (
  amount: number,
  description: string,
  metadata: Record<string, any> = {}
) => {
  try {
    console.log('PayMongo createPaymentIntent called with:', { amount, description, metadata });
    console.log('Using PayMongo API URL:', PAYMONGO_API_URL);
    console.log('Using PayMongo Secret Key (first 4 chars):', PAYMONGO_SECRET_KEY.substring(0, 4));

    const payload = {
      data: {
        attributes: {
          amount,
          payment_method_allowed: ['card', 'gcash'],
          payment_method_options: {
            card: {
              request_three_d_secure: 'any',
            },
          },
          currency: 'PHP',
          description,
          statement_descriptor: 'Siargao Rides',
          metadata,
        },
      },
    };

    // Log sanitized payload without sensitive data
    console.log('PayMongo request payload:', {
      type: 'payment_intent',
      amount: payload.data.attributes.amount,
      currency: payload.data.attributes.currency,
      description: payload.data.attributes.description,
      // Don't log full metadata
      metadata: '[REDACTED]'
    });

    const response = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodeApiKey(PAYMONGO_SECRET_KEY)}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('PayMongo API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayMongo API error response:', errorData);
      throw new Error(
        `PayMongo API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`
      );
    }

    const data = await response.json();
    console.log('PayMongo API success response:', {
      id: data.data.id,
      status: data.data.attributes.status,
      client_key: data.data.attributes.client_key,
    });
    return data.data;
  } catch (error) {
    console.error('Error creating PayMongo payment intent:', error);
    throw error;
  }
};

/**
 * Create a PayMongo Payment Method
 * @param type Payment method type (card, gcash, grab_pay, paymaya)
 * @param details Payment method details (for card payments)
 * @param billingInfo Billing information
 * @returns Payment Method object
 */
export const createPaymentMethod = async (
  type: 'card' | 'gcash',
  details?: {
    card_number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  },
  billingInfo?: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  }
) => {
  try {
    const payload: any = {
      data: {
        attributes: {
          type,
          details: type === 'card' ? details : undefined,
          billing: billingInfo,
        },
      },
    };

    const response = await fetch(`${PAYMONGO_API_URL}/payment_methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodeApiKey(PAYMONGO_PUBLIC_KEY)}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `PayMongo API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating PayMongo payment method:', error);
    throw error;
  }
};

/**
 * Attach a Payment Method to a Payment Intent
 * @param paymentIntentId Payment Intent ID
 * @param paymentMethodId Payment Method ID
 * @param clientKey Client key from the Payment Intent
 * @returns Updated Payment Intent object
 */
export const attachPaymentMethod = async (
  paymentIntentId: string,
  paymentMethodId: string,
  clientKey: string
) => {
  try {
    const response = await fetch(
      `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${encodeApiKey(PAYMONGO_SECRET_KEY)}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              client_key: clientKey,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `PayMongo API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error attaching payment method to intent:', error);
    throw error;
  }
};

/**
 * Get Payment Intent details
 * @param paymentIntentId Payment Intent ID
 * @returns Payment Intent object
 */
export const getPaymentIntent = async (paymentIntentId: string) => {
  try {
    const response = await fetch(
      `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${encodeApiKey(PAYMONGO_SECRET_KEY)}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `PayMongo API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting payment intent:', error);
    throw error;
  }
};

/**
 * Create a webhook for PayMongo
 * @param url Webhook URL
 * @param events Events to listen for
 * @returns Webhook object
 */
export const createWebhook = async (
  url: string,
  events: string[] = ['payment.paid', 'payment.failed']
) => {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodeApiKey(PAYMONGO_SECRET_KEY)}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            url,
            events,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `PayMongo API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating webhook:', error);
    throw error;
  }
};

/**
 * Convert amount to PayMongo format (in cents)
 * @param amount Amount in decimal (e.g., 100.00)
 * @returns Amount in cents (e.g., 10000)
 */
export const convertAmountToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Convert amount from PayMongo format (cents) to decimal
 * @param amount Amount in cents (e.g., 10000)
 * @returns Amount in decimal (e.g., 100.00)
 */
export const convertAmountFromCents = (amount: number): number => {
  return amount / 100;
};

/**
 * Verify PayMongo webhook signature
 * @param payload Raw request body as string
 * @param signature PayMongo signature from headers
 * @param webhookSecret Webhook secret from PayMongo dashboard
 * @returns Boolean indicating if signature is valid
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string | null,
  webhookSecret: string | undefined
): boolean => {
  try {
    // If signature or webhook secret is missing, verification fails
    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret for verification');
      return false;
    }


    // Extract timestamp and signatures from the header
    const [timestamp, signatures] = signature.split(',');
    const timestampValue = timestamp.split('=')[1];
    const signaturesValue = signatures.split('=')[1];

    // Create the signed payload
    const signedPayload = `${timestampValue}.${payload}`;

    // Create the expected signature using HMAC
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    // Compare the expected signature with the provided one
    return expectedSignature === signaturesValue;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};
