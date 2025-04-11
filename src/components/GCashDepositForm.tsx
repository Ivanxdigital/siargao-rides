'use client';

import GCashPaymentForm from './GCashPaymentForm';

interface GCashDepositFormProps {
  rentalId: string;
  totalAmount: number;
  vehicleName?: string;
  vehicleImage?: string;
  onSuccess?: (sourceId: string, checkoutUrl: string) => void;
  onError?: (error: string) => void;
}

export default function GCashDepositForm({
  rentalId,
  totalAmount,
  vehicleName,
  vehicleImage,
  onSuccess,
  onError
}: GCashDepositFormProps) {
  // Fixed deposit amount of 300 PHP
  const depositAmount = 300;

  return (
    <GCashPaymentForm
      rentalId={rentalId}
      amount={depositAmount}
      isDeposit={true}
      vehicleName={vehicleName}
      vehicleImage={vehicleImage}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}
