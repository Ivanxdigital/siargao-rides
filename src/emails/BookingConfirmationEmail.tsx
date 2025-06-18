import * as React from 'react';
import { 
  Html, 
  Head, 
  Body, 
  Container, 
  Section, 
  Text, 
  Heading, 
  Link, 
  Hr, 
  Button,
  Preview,
  Tailwind
} from '@react-email/components';
import { format } from 'date-fns';

interface BookingConfirmationEmailProps {
  booking: {
    id: string;
    confirmation_code: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: string;
    payment_status: string;
    payment_method_id?: string;
    deposit_required?: boolean;
    deposit_amount?: number;
    contact_info?: any;
    delivery_address?: string | null;
  };
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
  shop: {
    id: string;
    name: string;
    phone_number?: string | null;
    address?: string | null;
    email: string;
    owner_name?: string | null;
  };
}

export const BookingConfirmationEmail: React.FC<Readonly<BookingConfirmationEmailProps>> = ({
  booking,
  user,
  shop,
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Handle potential undefined or null values
  const safePrice = booking.total_price ? booking.total_price : 0;
  const safeDepositAmount = booking.deposit_amount ? booking.deposit_amount : 0;
  const confirmationCode = booking.confirmation_code || 'PENDING';
  const bookingId = booking.id || '';
  const bookingStatus = booking.status || 'pending';
  const paymentStatus = booking.payment_status || 'pending';

  return (
    <Html lang="en">
      <Head />
      <Preview>Your Siargao Rides Booking Request #{booking.confirmation_code} has been Submitted</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px] bg-white">
            <Section className="mt-4">
              <Heading className="text-2xl font-bold text-center text-black my-0">
                {bookingStatus === 'pending' ? 'Your Booking Request has been Submitted!' : 'Your Booking is Confirmed!'}
              </Heading>
              <Text className="text-gray-700">Dear {user.name || 'Valued Customer'},</Text>
              <Text className="text-gray-700">
                {bookingStatus === 'pending' 
                  ? 'Thank you for your booking request with Siargao Rides. Your request has been sent to the shop owner for review. Here are your booking details:'
                  : 'Thank you for booking with Siargao Rides. Here are your booking details:'
                }
              </Text>
            </Section>
            
            <Section>
              <Heading className="text-xl font-semibold text-black">Booking Information</Heading>
              <Text className="text-gray-700 my-1">
                <strong>Confirmation Code:</strong> {confirmationCode}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Dates:</strong> {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Total Amount:</strong> ₱{safePrice.toLocaleString()}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Status:</strong> {bookingStatus}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Payment Status:</strong> {paymentStatus}
              </Text>

              {booking.deposit_required && (
                <Text className="text-gray-700 my-1">
                  <strong>Deposit Required:</strong> ₱{safeDepositAmount.toLocaleString()}
                </Text>
              )}
            </Section>
            
            <Hr className="my-6 border-gray-300" />
            
            <Section>
              <Heading className="text-xl font-semibold text-black">Shop Information</Heading>
              <Text className="text-gray-700 my-1">
                <strong>Shop:</strong> {shop.name}
              </Text>
              {shop.phone_number && (
                <Text className="text-gray-700 my-1">
                  <strong>Contact:</strong> {shop.phone_number}
                </Text>
              )}
              {shop.address && (
                <Text className="text-gray-700 my-1">
                  <strong>Address:</strong> {shop.address}
                </Text>
              )}
            </Section>
            
            <Hr className="my-6 border-gray-300" />
            
            {bookingStatus === 'pending' && (
              <Section>
                <Heading className="text-xl font-semibold text-black">Next Steps</Heading>
                <Text className="text-gray-700">
                  <strong>1.</strong> The shop owner will review your booking request and contact you within 24 hours.
                </Text>
                <Text className="text-gray-700">
                  <strong>2.</strong> Once approved, you'll receive a confirmation email with pickup/delivery details.
                </Text>
                <Text className="text-gray-700">
                  <strong>3.</strong> Payment: You'll pay the full amount (₱{safePrice.toLocaleString()}) in cash when you visit the shop or receive the vehicle.
                </Text>
                <Text className="text-gray-700 text-sm bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                  <strong>Note:</strong> This is a request to book, not a confirmed reservation. The shop owner needs to approve your request before your booking is confirmed.
                </Text>
              </Section>
            )}
            
            {bookingStatus === 'confirmed' && (
              <Section>
                <Heading className="text-xl font-semibold text-black">Next Steps</Heading>
                <Text className="text-gray-700">
                  <strong>1.</strong> Your booking has been confirmed by the shop owner.
                </Text>
                <Text className="text-gray-700">
                  <strong>2.</strong> Payment: Pay the full amount (₱{safePrice.toLocaleString()}) in cash when you visit the shop or receive the vehicle.
                </Text>
                <Text className="text-gray-700">
                  <strong>3.</strong> Contact the shop if you have any questions about pickup/delivery.
                </Text>
              </Section>
            )}
            
            <Hr className="my-6 border-gray-300" />
            
            <Section className="text-center mt-8">
              <Button 
                className="bg-blue-600 text-white py-3 px-6 rounded text-sm font-bold no-underline"
                href={`https://siargaorides.com/bookings/${bookingId}`}
              >
                View Booking Details
              </Button>
              
              <Text className="text-gray-500 text-xs mt-8">
                If you have any questions, please contact us or the shop directly.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingConfirmationEmail; 