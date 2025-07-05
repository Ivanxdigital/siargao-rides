import * as React from 'react';
import { 
  Html, Head, Body, Container, Section, Text, Heading, 
  Hr, Button, Preview, Tailwind
} from '@react-email/components';

interface ShopOwnerOnboardingEmailProps {
  user: {
    firstName: string;
    email: string;
  };
}

export const ShopOwnerOnboardingEmail: React.FC<ShopOwnerOnboardingEmailProps> = ({
  user,
}) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Siargao Rides - Complete Your Shop Registration</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px] bg-white">
            <Section className="mt-4">
              <Heading className="text-2xl font-bold text-center text-black my-0">
                Welcome to Siargao Rides!
              </Heading>
              <Text className="text-gray-700">Hello {user.firstName || 'there'},</Text>
              <Text className="text-gray-700">
                Thank you for creating your account. You&apos;re one step away from listing your vehicles and growing your business.
              </Text>
            </Section>
            
            <Section className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
              <Heading className="text-lg font-bold text-blue-800 my-0">
                Complete Your Shop Registration
              </Heading>
              <Text className="text-gray-700">
                To start listing your vehicles, you need to complete your shop registration. This includes:
              </Text>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Shop information (name, address, etc.)</li>
                <li>ID verification</li>
                <li>Contact details</li>
              </ul>
            </Section>
            
            <Section className="text-center mt-8">
              <Button 
                className="bg-blue-600 text-white py-3 px-6 rounded text-sm font-bold no-underline"
                href="https://siargaorides.com/dashboard"
              >
                Complete Registration
              </Button>
              
              <Text className="text-gray-500 mt-4">
                After verification, you&apos;ll be able to add your vehicles and start accepting bookings.
              </Text>
            </Section>
            
            <Hr className="my-6 border-gray-300" />
            
            <Section>
              <Heading className="text-lg font-semibold text-black">Why Complete Your Registration?</Heading>
              <ul className="list-disc pl-5 text-gray-700">
                <li>List multiple vehicles to reach more tourists</li>
                <li>Manage your bookings through our easy dashboard</li>
                <li>Receive secure payments</li>
                <li>Get exposure to travelers visiting Siargao</li>
              </ul>
            </Section>
            
            <Section className="text-center mt-8">
              <Text className="text-gray-500 text-xs">
                If you have any questions, please contact our support team.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ShopOwnerOnboardingEmail; 