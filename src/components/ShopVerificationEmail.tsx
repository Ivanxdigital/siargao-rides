import * as React from 'react';

interface ShopVerificationEmailProps {
  shopName: string;
  ownerName: string;
  shopId: string;
}

export const ShopVerificationEmail: React.FC<ShopVerificationEmailProps> = ({
  shopName,
  ownerName,
  shopId,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', color: '#333' }}>
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <img 
        src="https://siargaorides.ph/logo.png" 
        alt="Siargao Rides Logo" 
        style={{ height: '60px' }} 
      />
    </div>
    
    <h1 style={{ color: '#0070f3', marginBottom: '16px', textAlign: 'center' }}>Congratulations! Your Shop is Verified</h1>
    
    <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f7f7f7', borderRadius: '8px' }}>
      <p style={{ fontSize: '16px', lineHeight: '1.6' }}>Hello {ownerName},</p>
      
      <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
        Great news! Your shop <strong>{shopName}</strong> has been verified by our team and is now ready 
        to start listing vehicles on Siargao Rides.
      </p>
      
      <div style={{ marginTop: '24px', marginBottom: '24px', padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '6px', borderLeft: '4px solid #0070f3' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#0070f3' }}>Next Steps:</h3>
        <ol style={{ margin: '0', padding: '0 0 0 20px' }}>
          <li style={{ marginBottom: '10px', fontSize: '15px' }}>
            <strong>List your first vehicle</strong> - Add a motorcycle, car, or other vehicle to your shop.
          </li>
          <li style={{ marginBottom: '10px', fontSize: '15px' }}>
            <strong>Upload vehicle documents</strong> - Each vehicle requires documentation for verification.
          </li>
          <li style={{ marginBottom: '10px', fontSize: '15px' }}>
            <strong>Complete your shop profile</strong> - Add operating hours, pickup details, and additional information.
          </li>
        </ol>
      </div>
      
      <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
        To start managing your shop, click the button below:
      </p>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href={`https://siargaorides.ph/dashboard/manage-shop/${shopId}`}
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block',
            fontSize: '16px'
          }}
        >
          Manage Your Shop
        </a>
      </div>
      
      <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
        Remember, your vehicle listings will need to be verified by our team before they become 
        publicly visible. This helps maintain quality standards for all Siargao Rides listings.
      </p>
      
      <p style={{ fontSize: '16px', lineHeight: '1.6', marginTop: '20px' }}>
        Need help? Our team is available to assist you. Simply reply to this email or contact us through the website.
      </p>
    </div>
    
    <div style={{ fontSize: '14px', color: '#666', marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
      <p>© 2023 Siargao Rides. All rights reserved.</p>
      <p style={{ marginTop: '10px' }}>Tourism Road, General Luna, Siargao Island, Surigao del Norte, Philippines</p>
    </div>
  </div>
); 