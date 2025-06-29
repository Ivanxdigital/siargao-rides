import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Block dates for a booking by creating entries in the blocked_dates table
 * 
 * @param rentalId The ID of the rental to block dates for
 * @returns Array of created blocked date records
 */
export const blockDatesForBooking = async (rentalId: string) => {
  try {
    console.log('Blocking dates for booking:', rentalId);
    
    // Get the rental details
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, vehicle_id, start_date, end_date')
      .eq('id', rentalId)
      .single();
      
    if (rentalError || !rental) {
      console.error('Error getting rental details:', rentalError);
      throw new Error('Rental not found');
    }
    
    console.log('Found rental:', rental);
    
    // Generate dates between start and end date
    const startDate = new Date(rental.start_date);
    const endDate = new Date(rental.end_date);
    const dates = [];
    
    // Create a date object for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Generated ${dates.length} dates to block`);
    
    // Check if dates are already blocked
    const { data: existingBlocks, error: existingError } = await supabase
      .from('vehicle_blocked_dates')
      .select('date')
      .eq('vehicle_id', rental.vehicle_id)
      .in('date', dates.map(d => d.toISOString().split('T')[0]));
      
    if (existingError) {
      console.error('Error checking existing blocked dates:', existingError);
    }
    
    // Filter out dates that are already blocked
    const existingDates = existingBlocks?.map(block => block.date) || [];
    const datesToBlock = dates.filter(date => 
      !existingDates.includes(date.toISOString().split('T')[0])
    );
    
    console.log(`Found ${existingDates.length} already blocked dates, blocking ${datesToBlock.length} new dates`);
    
    if (datesToBlock.length === 0) {
      console.log('No new dates to block');
      return [];
    }
    
    // Create blocked date entries
    const blockedDates = datesToBlock.map(date => ({
      vehicle_id: rental.vehicle_id,
      date: date.toISOString().split('T')[0],
      reason: `Booked (Rental #${rental.id})`,
      created_at: new Date().toISOString()
    }));
    
    const { data: createdBlocks, error: blockError } = await supabase
      .from('vehicle_blocked_dates')
      .insert(blockedDates)
      .select();
      
    if (blockError) {
      console.error('Error blocking dates:', blockError);
      throw new Error('Failed to block dates');
    }
    
    console.log(`Successfully blocked ${createdBlocks.length} dates`);
    return createdBlocks;
  } catch (error) {
    console.error('Error in blockDatesForBooking:', error);
    throw error;
  }
};
