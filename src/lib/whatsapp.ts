export const DEFAULT_WHATSAPP_NUMBER = '+639993702550'

function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^0-9]/g, '')
}

export function buildWhatsAppUrl({
  phoneNumber = DEFAULT_WHATSAPP_NUMBER,
  message,
}: {
  phoneNumber?: string
  message: string
}) {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${normalizePhoneNumber(phoneNumber)}?text=${encodedMessage}`
}

export const DEFAULT_LEAD_MESSAGE =
  "Hi Siargao Rides! I'd like a quote for a private service in Siargao.\n\n" +
  "Service (Airport Transfer / All-day Private Van / Private Tour): \n" +
  "Date: \n" +
  "Time: \n" +
  "Pickup location: \n" +
  "Drop-off / destination: \n" +
  "Passengers: \n" +
  "Luggage / surfboards: \n\n" +
  "Thank you!"

