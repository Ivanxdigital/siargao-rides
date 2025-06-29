import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// Create admin supabase client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface SMSNotification {
  to: string;
  message: string;
  shopId: string;
  rentalId: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export class SemaphoreService {
  private apiKey: string | null = null;
  private isConfigured: boolean = false;
  private apiUrl: string = 'https://api.semaphore.co/api/v4/messages';
  private senderName: string = 'SEMAPHORE';
  
  constructor() {
    // Check if Semaphore credentials are configured
    if (process.env.SEMAPHORE_API_KEY) {
      try {
        this.apiKey = process.env.SEMAPHORE_API_KEY;
        this.senderName = process.env.SEMAPHORE_SENDER_NAME || 'SEMAPHORE';
        this.isConfigured = true;
        console.log('Semaphore service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Semaphore client:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('Semaphore credentials not configured. SMS notifications will be disabled.');
    }
  }

  /**
   * Validate and format phone number for Semaphore (Philippine mobile numbers)
   * Supports both 09xxxxxxxxx and +639xxxxxxxxx formats
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remove all non-numeric characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Handle different Philippine number formats
    if (cleaned.startsWith('+63')) {
      // Already in international format
      cleaned = cleaned.substring(3); // Remove +63
    } else if (cleaned.startsWith('63')) {
      // Remove country code
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      // Remove leading 0 (common in Philippine format)
      cleaned = cleaned.substring(1);
    }
    
    // Validate Philippine mobile number format (should start with 9 and be 10 digits)
    if (cleaned.startsWith('9') && cleaned.length === 10) {
      // For Semaphore, we can use either format: 09xxxxxxxxx or +639xxxxxxxxx
      // Let's use the +63 format for consistency
      return '+63' + cleaned;
    }
    
    // Invalid format
    return null;
  }

  /**
   * Send a booking notification SMS to a shop owner
   */
  async sendBookingNotification(notification: SMSNotification): Promise<SMSResult> {
    if (!this.isConfigured || !this.apiKey) {
      console.log('Semaphore not configured, skipping SMS notification');
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    try {
      // Validate and format phone number
      const formattedPhone = this.formatPhoneNumber(notification.to);
      if (!formattedPhone) {
        throw new Error(`Invalid phone number format: ${notification.to}`);
      }

      console.log(`Sending SMS to ${formattedPhone} for booking ${notification.rentalId}`);

      // Prepare request body for Semaphore API
      const requestBody = new URLSearchParams({
        apikey: this.apiKey,
        number: formattedPhone,
        message: notification.message,
        sendername: this.senderName
      });

      // Send SMS via Semaphore API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Semaphore API error: ${responseData.message || 'Unknown error'}`);
      }

      // Extract message ID from response
      const messageId = responseData.message_id || responseData[0]?.message_id;
      
      if (!messageId) {
        throw new Error('No message ID returned from Semaphore API');
      }

      console.log(`SMS sent successfully. Message ID: ${messageId}`);

      // Log to database
      await this.logSMSNotification({
        shopId: notification.shopId,
        rentalId: notification.rentalId,
        phoneNumber: formattedPhone,
        message: notification.message,
        semaphoreMessageId: messageId,
        status: 'sent'
      });

      return {
        success: true,
        messageId: messageId
      };

    } catch (error: any) {
      console.error('Error sending SMS:', error);
      
      // Extract error details
      const errorMessage = error.message || 'Unknown error';
      const errorCode = error.code || 'UNKNOWN';
      
      // Log failed attempt to database
      await this.logSMSNotification({
        shopId: notification.shopId,
        rentalId: notification.rentalId,
        phoneNumber: notification.to,
        message: notification.message,
        status: 'failed',
        errorMessage: `${errorCode}: ${errorMessage}`,
        errorCode
      });

      return {
        success: false,
        error: errorMessage,
        errorCode
      };
    }
  }

  /**
   * Log SMS notification to database
   */
  private async logSMSNotification(data: {
    shopId: string;
    rentalId: string;
    phoneNumber: string;
    message: string;
    semaphoreMessageId?: string;
    status: string;
    errorMessage?: string;
    errorCode?: string;
  }): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('sms_notification_history')
        .insert({
          shop_id: data.shopId,
          rental_id: data.rentalId,
          phone_number: data.phoneNumber,
          message_content: data.message,
          semaphore_message_id: data.semaphoreMessageId,
          status: data.status,
          error_message: data.errorMessage,
          error_code: data.errorCode
        });

      if (error) {
        console.error('Error logging SMS notification:', error);
      }
    } catch (error) {
      console.error('Unexpected error logging SMS notification:', error);
    }
  }

  /**
   * Create a booking notification message
   */
  static createBookingMessage(data: {
    customerName: string;
    vehicleName: string;
    startDate: string;
    endDate: string;
    bookingId: string;
    isVanHire?: boolean;
    pickupLocation?: string;
    pickupTime?: string;
  }): string {
    const startDateFormatted = format(new Date(data.startDate), 'MMM dd');
    const endDateFormatted = format(new Date(data.endDate), 'MMM dd');
    
    if (data.isVanHire && data.pickupLocation && data.pickupTime) {
      const pickupTimeFormatted = format(new Date(data.pickupTime), 'h:mm a');
      return (
        `New van hire booking!\n` +
        `Customer: ${data.customerName}\n` +
        `Pickup: ${data.pickupLocation}\n` +
        `Time: ${pickupTimeFormatted} on ${startDateFormatted}\n` +
        `View: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings/${data.bookingId}`
      );
    }
    
    return (
      `New booking request!\n` +
      `Customer: ${data.customerName}\n` +
      `Vehicle: ${data.vehicleName}\n` +
      `Dates: ${startDateFormatted} - ${endDateFormatted}\n` +
      `View: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings/${data.bookingId}`
    );
  }

  /**
   * Check if SMS service is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Poll Semaphore API to check message status
   * Since Semaphore may not support webhooks, we can use this for periodic status checks
   */
  async checkMessageStatus(messageId: string): Promise<{
    status: string;
    delivered?: boolean;
    error?: string;
  } | null> {
    if (!this.isConfigured || !this.apiKey) {
      console.log('Semaphore not configured, cannot check message status');
      return null;
    }

    try {
      // This would need to be adjusted based on Semaphore's actual message retrieval API
      const response = await fetch(`https://api.semaphore.co/api/v4/messages/${messageId}?apikey=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Failed to check message status:', response.status);
        return null;
      }

      const data = await response.json();
      
      return {
        status: data.status || 'unknown',
        delivered: data.status?.toLowerCase() === 'delivered',
        error: data.error_message
      };

    } catch (error) {
      console.error('Error checking message status:', error);
      return null;
    }
  }

  /**
   * Bulk check status for multiple messages
   * Useful for periodic batch status updates
   */
  async checkPendingMessageStatuses(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      // Get pending messages from database
      const { data: pendingMessages, error } = await supabaseAdmin
        .from('sms_notification_history')
        .select('semaphore_message_id, id')
        .eq('status', 'sent')
        .not('semaphore_message_id', 'is', null)
        .limit(50); // Process in batches

      if (error) {
        console.error('Error fetching pending messages:', error);
        return;
      }

      if (!pendingMessages || pendingMessages.length === 0) {
        return;
      }

      console.log(`Checking status for ${pendingMessages.length} pending messages`);

      // Check each message status
      for (const msg of pendingMessages) {
        const statusResult = await this.checkMessageStatus(msg.semaphore_message_id);
        
        if (statusResult) {
          let mappedStatus: 'delivered' | 'failed' | 'undelivered' = 'undelivered';
          
          switch (statusResult.status.toLowerCase()) {
            case 'delivered':
            case 'success':
              mappedStatus = 'delivered';
              break;
            case 'failed':
            case 'error':
              mappedStatus = 'failed';
              break;
            default:
              continue; // Skip updating if still pending
          }

          // Update the message status
          await this.updateMessageStatus(
            msg.semaphore_message_id,
            mappedStatus,
            undefined,
            statusResult.error
          );
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error('Error in bulk status check:', error);
    }
  }

  /**
   * Update SMS delivery status (for webhook handling)
   */
  async updateMessageStatus(
    messageId: string, 
    status: 'delivered' | 'failed' | 'undelivered',
    errorCode?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      if (errorCode) {
        updateData.error_code = errorCode;
      }

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabaseAdmin
        .from('sms_notification_history')
        .update(updateData)
        .eq('semaphore_message_id', messageId);

      if (error) {
        console.error('Error updating SMS status:', error);
      }
    } catch (error) {
      console.error('Unexpected error updating SMS status:', error);
    }
  }
}

// Export a singleton instance
export const smsService = new SemaphoreService();

// Maintain backward compatibility
export const twilioService = smsService;

// Export the service class for type compatibility
export const TwilioService = SemaphoreService;