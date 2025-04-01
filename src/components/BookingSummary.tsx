"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { Bike, RentalShop } from "@/lib/types";
import { differenceInDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface BookingSummaryProps {
  bike: Bike;
  shop: RentalShop;
  startDate: Date | null;
  endDate: Date | null;
  deliveryFee?: number;
}

export default function BookingSummary({ 
  bike, 
  shop, 
  startDate, 
  endDate,
  deliveryFee = 0
}: BookingSummaryProps) {
  const [totalDays, setTotalDays] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Calculate rental duration and costs
  useEffect(() => {
    if (startDate && endDate) {
      // Calculate days between dates (inclusive)
      const dayCount = differenceInDays(endDate, startDate) + 1;
      setTotalDays(dayCount);
      
      // Calculate price based on duration
      let price = 0;
      
      // For longer rentals, apply weekly/monthly rates if available
      if (dayCount >= 30 && bike.price_per_month) {
        const months = Math.floor(dayCount / 30);
        const remainingDays = dayCount % 30;
        price = months * bike.price_per_month;
        
        if (remainingDays > 0) {
          if (remainingDays >= 7 && bike.price_per_week) {
            const weeks = Math.floor(remainingDays / 7);
            const remainingDaysAfterWeeks = remainingDays % 7;
            price += weeks * bike.price_per_week;
            price += remainingDaysAfterWeeks * bike.price_per_day;
          } else {
            price += remainingDays * bike.price_per_day;
          }
        }
      } else if (dayCount >= 7 && bike.price_per_week) {
        const weeks = Math.floor(dayCount / 7);
        const remainingDays = dayCount % 7;
        price = weeks * bike.price_per_week;
        
        if (remainingDays > 0) {
          price += remainingDays * bike.price_per_day;
        }
      } else {
        price = dayCount * bike.price_per_day;
      }
      
      setSubtotal(price);
      setTotal(price + deliveryFee);
    } else {
      setTotalDays(0);
      setSubtotal(0);
      setTotal(0);
    }
  }, [startDate, endDate, bike, deliveryFee]);
  
  return (
    <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-5 shadow-sm sticky top-6">
      <h3 className="font-semibold mb-4 text-lg pb-2 border-b border-white/10">Booking Summary</h3>
      
      {/* Bike details */}
      <div className="flex items-center gap-3 mb-6">
        {bike?.images && bike.images[0]?.image_url && (
          <div className="w-20 h-20 relative rounded-md overflow-hidden">
            <Image
              src={bike.images[0].image_url}
              alt={bike.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h4 className="font-medium">{bike?.name}</h4>
          <p className="text-sm text-white/70">{shop?.name}</p>
        </div>
      </div>
      
      {!startDate || !endDate ? (
        <div className="text-center py-4 border border-dashed border-white/20 rounded-lg mb-4">
          <p className="text-white/50 text-sm">
            Select dates to view price details
          </p>
        </div>
      ) : (
        <>
          {/* Price breakdown */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-start">
              <span className="text-white/70">Rental Period:</span>
              <span className="font-medium text-right">{totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-white/70">Rate:</span>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(bike.price_per_day)}/day</div>
                {bike.price_per_week && (
                  <div className="text-xs text-white/50">{formatCurrency(bike.price_per_week)}/week</div>
                )}
                {bike.price_per_month && (
                  <div className="text-xs text-white/50">{formatCurrency(bike.price_per_month)}/month</div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-white/70">Delivery Fee:</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
          </div>
          
          {/* Total */}
          <div className="border-t border-white/10 pt-3 mt-4">
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-semibold">{formatCurrency(total)}</span>
            </div>
          </div>
        </>
      )}
      
      {/* ID deposit info */}
      <div className="mt-6 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-md text-xs">
        <p className="text-yellow-400 font-medium mb-1">Deposit Required</p>
        <p className="text-white/80">A valid ID will be required as a deposit when picking up the bike.</p>
      </div>
      
      {/* Cancellation policy */}
      <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded-md text-xs">
        <p className="text-blue-400 font-medium mb-1">Cancellation Policy</p>
        <p className="text-white/80">Free cancellation up to 24 hours before pickup.</p>
      </div>
    </div>
  );
} 