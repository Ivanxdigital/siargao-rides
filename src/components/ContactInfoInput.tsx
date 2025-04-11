"use client"

import { useState, useEffect } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Common country codes with flags
const countryCodes = [
  { code: "+63", country: "PH", flag: "🇵🇭" }, // Philippines
  { code: "+1", country: "US", flag: "🇺🇸" },  // United States
  { code: "+44", country: "GB", flag: "🇬🇧" }, // United Kingdom
  { code: "+61", country: "AU", flag: "🇦🇺" }, // Australia
  { code: "+65", country: "SG", flag: "🇸🇬" }, // Singapore
  { code: "+82", country: "KR", flag: "🇰🇷" }, // South Korea
  { code: "+81", country: "JP", flag: "🇯🇵" }, // Japan
  { code: "+49", country: "DE", flag: "🇩🇪" }, // Germany
  { code: "+33", country: "FR", flag: "🇫🇷" }, // France
  { code: "+39", country: "IT", flag: "🇮🇹" }, // Italy
  { code: "+34", country: "ES", flag: "🇪🇸" }, // Spain
  { code: "+86", country: "CN", flag: "🇨🇳" }, // China
  { code: "+91", country: "IN", flag: "🇮🇳" }, // India
];

export type ContactMethod = "whatsapp" | "telegram" | "";
export type ContactInfo = {
  method: ContactMethod;
  countryCode: string;
  number: string;
};

interface ContactInfoInputProps {
  value: ContactInfo;
  onChange: (value: ContactInfo) => void;
  required?: boolean;
}

export default function ContactInfoInput({
  value,
  onChange,
  required = false
}: ContactInfoInputProps) {
  const [contactMethod, setContactMethod] = useState<ContactMethod>(value.method || "");
  const [countryCode, setCountryCode] = useState(value.countryCode || "+63"); // Default to Philippines
  const [phoneNumber, setPhoneNumber] = useState(value.number || "");
  
  // Update parent component when values change
  useEffect(() => {
    if (contactMethod) {
      onChange({
        method: contactMethod,
        countryCode,
        number: phoneNumber
      });
    } else {
      // If no contact method is selected, clear the contact info
      onChange({
        method: "",
        countryCode: "",
        number: ""
      });
    }
  }, [contactMethod, countryCode, phoneNumber, onChange]);
  
  // Handle contact method selection
  const handleMethodSelect = (method: ContactMethod) => {
    setContactMethod(method === contactMethod ? "" : method);
  };
  
  // Handle country code selection
  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountryCode(e.target.value);
  };
  
  // Handle phone number input
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and spaces
    const value = e.target.value.replace(/[^0-9\s]/g, "");
    setPhoneNumber(value);
  };
  
  return (
    <div className="space-y-3">
      <div>
        <Label className="block mb-2 text-sm font-medium">
          Contact Method {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={contactMethod === "whatsapp" ? "default" : "outline"}
            className={`flex items-center ${contactMethod === "whatsapp" ? "bg-green-600 hover:bg-green-700" : ""}`}
            onClick={() => handleMethodSelect("whatsapp")}
          >
            <Phone className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            type="button"
            variant={contactMethod === "telegram" ? "default" : "outline"}
            className={`flex items-center ${contactMethod === "telegram" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            onClick={() => handleMethodSelect("telegram")}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Telegram
          </Button>
        </div>
        {required && !contactMethod && (
          <p className="mt-1 text-xs text-red-500">Please select a contact method</p>
        )}
      </div>
      
      {contactMethod && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="countryCode" className="block mb-2 text-sm font-medium">
              Country Code
            </Label>
            <select
              id="countryCode"
              value={countryCode}
              onChange={handleCountryCodeChange}
              className="bg-white/5 border border-white/10 text-white rounded-md block w-full p-2.5 focus:ring-primary focus:border-primary"
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code} ({country.country})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="9123456789"
              className="bg-white/5 border border-white/10 text-white"
              required={required && !!contactMethod}
            />
            {required && contactMethod && !phoneNumber && (
              <p className="mt-1 text-xs text-red-500">Please enter your phone number</p>
            )}
          </div>
          
          <div className="text-xs text-white/60">
            {contactMethod === "whatsapp" ? (
              <p>We'll use this WhatsApp number to contact you about your booking if needed.</p>
            ) : (
              <p>We'll use this Telegram number to contact you about your booking if needed.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
