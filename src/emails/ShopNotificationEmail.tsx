import * as React from 'react';
import { 
  Html, 
  Head, 
  Body, 
  Container, 
  Section, 
  Text, 
  Heading, 
  Hr, 
  Button,
  Preview,
  Tailwind
} from '@react-email/components';
import { format } from 'date-fns';

interface ShopNotificationEmailProps {
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
    contact_info?: { name?: string; email?: string; phone?: string };
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
    owner_name?: string | null;
    phone_number?: string | null;
    address?: string | null;
    email?: string;
  };
}

export const ShopNotificationEmail: React.FC<Readonly<ShopNotificationEmailProps>> = ({
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

  return (
    <Html lang="en">
      <Head />
      <Preview>New Booking Request #{booking.confirmation_code} - Action Required</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px] bg-white">
            <Section className="mt-4">
              <Heading className="text-2xl font-bold text-center text-black my-0">
                New Booking Request
              </Heading>
              <Text className="text-gray-700">Hello {shop.owner_name || shop.name},</Text>
              <Text className="text-gray-700">
                You have received a new booking request from {user.name || 'a customer'}:
              </Text>
            </Section>
            
            <Section>
              <Heading className="text-xl font-semibold text-black">Booking Information</Heading>
              <Text className="text-gray-700 my-1">
                <strong>Confirmation Code:</strong> {booking.confirmation_code}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Dates:</strong> {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Total Amount:</strong> ₱{safePrice.toLocaleString()}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Status:</strong> {booking.status}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Payment Status:</strong> {booking.payment_status}
              </Text>
            </Section>
            
            <Hr className="my-6 border-gray-300" />
            
            <Section>
              <Heading className="text-xl font-semibold text-black">Customer Information</Heading>
              <Text className="text-gray-700 my-1">
                <strong>Name:</strong> {user.name || 'Not provided'}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Email:</strong> {user.email}
              </Text>
              {booking.contact_info && booking.contact_info.method && booking.contact_info.number && (
                <Text className="text-gray-700 my-1">
                  <strong>Contact:</strong> {booking.contact_info.method}: {booking.contact_info.countryCode} {booking.contact_info.number}
                </Text>
              )}
              {booking.delivery_address && (
                <div>
                  <Text className="text-gray-700 my-1">
                    <strong>Delivery Address:</strong>
                  </Text>
                  <Text className="text-gray-700 my-1 whitespace-pre-wrap pl-4">
                    {booking.delivery_address}
                  </Text>
                </div>
              )}
            </Section>
            
            <Section className="bg-blue-50 p-4 rounded my-6 border border-blue-200">
              <Heading className="text-lg font-semibold text-blue-800">Payment Information</Heading>
              <Text className="text-blue-800">
                <strong>Cash Payment:</strong> The customer will pay the full amount (₱{safePrice.toLocaleString()}) in cash when they visit your shop or when you deliver the vehicle.
              </Text>
              <Text className="text-blue-800 text-sm">
                No online payment has been processed - this is a cash-only booking request.
              </Text>
            </Section>
            
            <Section className="bg-yellow-50 p-4 rounded my-6 border border-yellow-200">
              <Heading className="text-lg font-semibold text-yellow-800">Action Required</Heading>
              <Text className="text-yellow-800">
                <strong>Please respond to this booking request:</strong>
              </Text>
              <Text className="text-yellow-800">
                • Log in to your dashboard to accept or decline this request
              </Text>
              <Text className="text-yellow-800">
                • If accepted, coordinate pickup/delivery details with the customer
              </Text>
              <Text className="text-yellow-800">
                • The customer is waiting for your approval to confirm their plans
              </Text>
            </Section>
            
            <Section className="text-center mt-8">
              <Button 
                className="bg-blue-600 text-white py-3 px-6 rounded text-sm font-bold no-underline"
                href={`https://siargaorides.com/dashboard/bookings/${booking.id}`}
              >
                View Booking Details
              </Button>
              
              <Text className="text-gray-500 text-xs mt-8">
                This is an automated message from Siargao Rides. Please do not reply to this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ShopNotificationEmail; 