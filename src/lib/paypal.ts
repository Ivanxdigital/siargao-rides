/**
 * PayPal API Service
 * This service handles all interactions with the PayPal API v2
 * Following 2025 best practices with Orders API
 */

// PayPal API keys and configuration
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_ENVIRONMENT === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// Check if API keys are set
if (!PAYPAL_CLIENT_ID) {
  console.error('NEXT_PUBLIC_PAYPAL_CLIENT_ID environment variable is not set');
}

if (!PAYPAL_CLIENT_SECRET) {
  console.error('PAYPAL_CLIENT_SECRET environment variable is not set');
}

// Log environment variables (without exposing full keys)
console.log('PayPal Environment Variables Check:');
console.log('- CLIENT_ID exists:', !!PAYPAL_CLIENT_ID);
console.log('- CLIENT_ID prefix:', PAYPAL_CLIENT_ID?.substring(0, 7) || 'N/A');
console.log('- CLIENT_SECRET exists:', !!PAYPAL_CLIENT_SECRET);
console.log('- CLIENT_SECRET prefix:', PAYPAL_CLIENT_SECRET?.substring(0, 7) || 'N/A');
console.log('- Environment:', PAYPAL_ENVIRONMENT);
console.log('- API Base URL:', PAYPAL_BASE_URL);

/**
 * Get PayPal access token for API authentication
 * @returns Access token for PayPal API calls
 */
const getAccessToken = async (): Promise<string> => {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal access token error:', errorData);
      throw new Error(`PayPal auth error: ${errorData.error_description || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw error;
  }
};

/**
 * Create a PayPal Order (equivalent to PayMongo's Payment Intent)
 * @param amount Amount in PHP (e.g., 100.00)
 * @param description Description of the payment
 * @param metadata Additional metadata for the order
 * @returns PayPal Order object
 */
export const createPayPalOrder = async (
  amount: number,
  description: string,
  metadata: Record<string, any> = {}
) => {
  try {
    console.log('PayPal createOrder called with:', { amount, description, metadata });
    
    const accessToken = await getAccessToken();
    
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: metadata.rental_id || 'default',
          description: description,
          amount: {
            currency_code: 'PHP',
            value: amount.toFixed(2),
          },
          custom_id: metadata.rental_id,
        },
      ],
      application_context: {
        brand_name: 'Siargao Rides',
        locale: 'en-PH',
        user_action: 'PAY_NOW',
        payment_method: {
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
      },
    };

    console.log('PayPal order payload:', {
      intent: payload.intent,
      amount: payload.purchase_units[0].amount,
      description: payload.purchase_units[0].description,
      reference_id: payload.purchase_units[0].reference_id,
    });

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${Date.now()}-${Math.random()}`, // Idempotency key
      },
      body: JSON.stringify(payload),
    });

    console.log('PayPal API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal API error response:', errorData);
      throw new Error(
        `PayPal API Error: ${errorData.details?.[0]?.description || 'Unknown error'}`
      );
    }

    const data = await response.json();
    console.log('PayPal order created successfully:', {
      id: data.id,
      status: data.status,
      intent: data.intent,
    });

    return data;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
};

/**
 * Capture a PayPal Order (complete the payment)
 * @param orderId PayPal Order ID
 * @returns Captured order details
 */
export const capturePayPalOrder = async (orderId: string) => {
  try {
    console.log('PayPal captureOrder called with orderId:', orderId);
    
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${Date.now()}-${Math.random()}`, // Idempotency key
      },
    });

    console.log('PayPal capture response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal capture error response:', errorData);
      throw new Error(
        `PayPal Capture Error: ${errorData.details?.[0]?.description || 'Unknown error'}`
      );
    }

    const data = await response.json();
    console.log('PayPal order captured successfully:', {
      id: data.id,
      status: data.status,
      capture_id: data.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    });

    return data;
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw error;
  }
};

/**
 * Get PayPal Order details
 * @param orderId PayPal Order ID
 * @returns Order details
 */
export const getPayPalOrder = async (orderId: string) => {
  try {
    console.log('PayPal getOrder called with orderId:', orderId);
    
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal get order error:', errorData);
      throw new Error(
        `PayPal API Error: ${errorData.details?.[0]?.description || 'Unknown error'}`
      );
    }

    const data = await response.json();
    console.log('PayPal order retrieved:', {
      id: data.id,
      status: data.status,
      intent: data.intent,
    });

    return data;
  } catch (error) {
    console.error('Error getting PayPal order:', error);
    throw error;
  }
};

/**
 * Verify PayPal webhook signature
 * @param payload Raw request body as string
 * @param headers Request headers containing webhook signature
 * @param webhookId PayPal webhook ID from dashboard
 * @returns Boolean indicating if signature is valid
 */
export const verifyPayPalWebhookSignature = async (
  payload: string,
  headers: Record<string, string>,
  webhookId: string
): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();
    
    // Extract required headers
    const authAlgo = headers['paypal-auth-algo'];
    const transmission_id = headers['paypal-transmission-id'];
    const cert_id = headers['paypal-cert-id'];
    const transmission_time = headers['paypal-transmission-time'];
    const webhook_event = JSON.parse(payload);

    if (!authAlgo || !transmission_id || !cert_id || !transmission_time) {
      console.error('Missing required PayPal webhook headers');
      return false;
    }

    const verifyPayload = {
      auth_algo: authAlgo,
      cert_id: cert_id,
      transmission_id: transmission_id,
      transmission_time: transmission_time,
      webhook_id: webhookId,
      webhook_event: webhook_event,
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(verifyPayload),
    });

    if (!response.ok) {
      console.error('PayPal webhook verification failed:', response.status);
      return false;
    }

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying PayPal webhook signature:', error);
    return false;
  }
};

/**
 * Convert amount to PayPal format (string with 2 decimal places)
 * @param amount Amount in decimal (e.g., 100.00)
 * @returns Amount as string (e.g., "100.00")
 */
export const formatPayPalAmount = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Convert amount from PayPal format to decimal
 * @param amount Amount as string (e.g., "100.00")
 * @returns Amount in decimal (e.g., 100.00)
 */
export const parsePayPalAmount = (amount: string): number => {
  return parseFloat(amount);
};

/**
 * Get PayPal payment status from order
 * @param order PayPal order object
 * @returns Simplified status string
 */
export const getPayPalPaymentStatus = (order: any): string => {
  const status = order.status;
  
  switch (status) {
    case 'CREATED':
    case 'SAVED':
    case 'APPROVED':
      return 'pending';
    case 'COMPLETED':
      return 'paid';
    case 'VOIDED':
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'pending';
  }
};

/**
 * Extract capture ID from completed PayPal order
 * @param order Completed PayPal order object
 * @returns Capture ID or null
 */
export const extractCaptureId = (order: any): string | null => {
  try {
    return order.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;
  } catch (error) {
    console.error('Error extracting capture ID:', error);
    return null;
  }
};