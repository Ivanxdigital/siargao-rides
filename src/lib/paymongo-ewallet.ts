/**
 * PayMongo E-Wallet Integration
 * This file handles the integration with PayMongo's e-wallet payment methods (GCash)
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// PayMongo API keys
const PAYMONGO_SECRET_KEY = process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY || 'sk_test_V5Q9YKvJ8xkLui4rWCZn7fbL';
const PAYMONGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY || 'pk_test_XeFkLLimXvWEHfoF4NCQSxtA';
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

// Helper function to encode API key for Basic Auth
const encodeApiKey = (apiKey: string): string => {
  return Buffer.from(`${apiKey}:`).toString('base64');
};

/**
 * Create a PayMongo Source for GCash payment
 * This generates a checkout URL that the user will be redirected to
 * 
 * @param amount Amount in decimal (e.g., 100.00)
 * @param description Description of the payment
 * @param successUrl URL to redirect after successful payment
 * @param failureUrl URL to redirect after failed payment
 * @param billingInfo Customer billing information
 * @returns Source object with checkout URL
 */
export const createGCashSource = async (
  amount: number,
  description: string,
  successUrl: string,
  failureUrl: string,
  billingInfo: {
    name: string;
    email: string;
    phone?: string;
  }
) => {
  try {
    console.log('Creating GCash source with amount:', amount);
    
    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);
    
    const payload = {
      data: {
        attributes: {
          amount: amountInCents,
          redirect: {
            success: successUrl,
            failed: failureUrl
          },
          type: 'gcash',
          currency: 'PHP',
          billing: {
            name: billingInfo.name,
            email: billingInfo.email,
            phone: billingInfo.phone
          }
        }
      }
    };
    
    console.log('PayMongo GCash source request payload:', JSON.stringify(payload));
    
    const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodeApiKey(PAYMONGO_SECRET_KEY)}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayMongo GCash source error:', errorData);
      throw new Error(`PayMongo API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('PayMongo GCash source created:', {
      id: data.data.id,
      checkoutUrl: data.data.attributes.redirect.checkout_url
    });
    
    return data.data;
  } catch (error) {
    console.error('Error creating GCash source:', error);
    throw error;
  }
};

/**
 * Create a PayMongo Payment from a Source
 * This should be called from your webhook handler when you receive a source.chargeable event
 * 
 * @param sourceId ID of the Source to create a payment from
 * @param amount Amount in decimal (e.g., 100.00)
 * @param description Description of the payment
 * @returns Payment object
 */
export const createPaymentFromSource = async (
  sourceId: string,
  amount: number,
  description: string
) => {
  try {
    console.log('Creating payment from source:', sourceId);
    
    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);
    
    const payload = {
      data: {
        attributes: {
          amount: amountInCents,
          source: {
            id: sourceId,
            type: 'source'
          },
          currency: 'PHP',
          description
        }
      }
    };
    
    const response = await fetch(`${PAYMONGO_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodeApiKey(PAYMONGO_SECRET_KEY)}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayMongo payment error:', errorData);
      throw new Error(`PayMongo API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('PayMongo payment created:', {
      id: data.data.id,
      status: data.data.attributes.status
    });
    
    return data.data;
  } catch (error) {
    console.error('Error creating payment from source:', error);
    throw error;
  }
};

/**
 * Retrieve a Source to check its status
 * 
 * @param sourceId ID of the Source to retrieve
 * @returns Source object
 */
export const retrieveSource = async (sourceId: string) => {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/sources/${sourceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodeApiKey(PAYMONGO_SECRET_KEY)}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayMongo API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error retrieving source:', error);
    throw error;
  }
};

/**
 * Store source information in the database
 * 
 * @param sourceId Source ID from PayMongo
 * @param rentalId Rental ID in your system
 * @param amount Amount of the payment
 * @param checkoutUrl Checkout URL for the e-wallet
 * @returns Database record
 */
export const storeSourceInDatabase = async (
  sourceId: string,
  rentalId: string,
  amount: number,
  checkoutUrl: string
) => {
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('paymongo_sources')
      .insert({
        source_id: sourceId,
        rental_id: rentalId,
        amount: amount,
        checkout_url: checkoutUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error storing source in database:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error storing source in database:', error);
    throw error;
  }
};
