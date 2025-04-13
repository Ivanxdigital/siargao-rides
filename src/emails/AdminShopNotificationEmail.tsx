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

interface AdminShopNotificationEmailProps {
  shop: {
    id: string;
    name: string;
    description?: string | null;
    address?: string | null;
    phone_number?: string | null;
    email?: string | null;
    created_at: string;
  };
  owner: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    phone_number?: string | null;
  };
}

export const AdminShopNotificationEmail: React.FC<AdminShopNotificationEmailProps> = ({
  shop,
  owner,
}) => {
  const shopId = shop.id;
  const ownerName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Shop Owner';
  const formattedDate = shop.created_at ? format(new Date(shop.created_at), 'PPP p') : 'Unknown date';
  
  return (
    <Html lang="en">
      <Head />
      <Preview>New Shop Application: {shop.name} - Verification Required</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px] bg-white">
            <Section className="mt-4">
              <Heading className="text-2xl font-bold text-center text-black my-0">
                New Shop Application
              </Heading>
              <Text className="text-gray-700">Hello Admin,</Text>
              <Text className="text-gray-700">
                A new shop has been registered on Siargao Rides and requires verification:
              </Text>
            </Section>
            
            <Section className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
              <Heading className="text-lg font-bold text-blue-800 my-0">
                Shop Details
              </Heading>
              <Text className="text-gray-700 my-1">
                <strong>Name:</strong> {shop.name}
              </Text>
              {shop.description && (
                <Text className="text-gray-700 my-1">
                  <strong>Description:</strong> {shop.description}
                </Text>
              )}
              {shop.address && (
                <Text className="text-gray-700 my-1">
                  <strong>Address:</strong> {shop.address}
                </Text>
              )}
              {shop.phone_number && (
                <Text className="text-gray-700 my-1">
                  <strong>Phone:</strong> {shop.phone_number}
                </Text>
              )}
              {shop.email && (
                <Text className="text-gray-700 my-1">
                  <strong>Email:</strong> {shop.email}
                </Text>
              )}
              <Text className="text-gray-700 my-1">
                <strong>Submitted:</strong> {formattedDate}
              </Text>
            </Section>
            
            <Section className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
              <Heading className="text-lg font-bold text-green-800 my-0">
                Owner Information
              </Heading>
              <Text className="text-gray-700 my-1">
                <strong>Name:</strong> {ownerName}
              </Text>
              <Text className="text-gray-700 my-1">
                <strong>Email:</strong> {owner.email}
              </Text>
              {owner.phone_number && (
                <Text className="text-gray-700 my-1">
                  <strong>Phone:</strong> {owner.phone_number}
                </Text>
              )}
            </Section>
            
            <Hr className="my-6 border-gray-300" />
            
            <Section className="text-center mt-8">
              <Button 
                className="bg-blue-600 text-white py-3 px-6 rounded text-sm font-bold no-underline"
                href={`https://siargaorides.ph/dashboard/admin/verification`}
              >
                Verify Shop
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

export default AdminShopNotificationEmail;
