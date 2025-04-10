"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

// Icons
import {
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Check
} from "lucide-react";

export default function DepositPayoutManager() {
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [completedPayouts, setCompletedPayouts] = useState<any[]>([]);
  const [expandedRental, setExpandedRental] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPayouts();
  }, [filterStatus]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      console.log("Fetching payouts...");

      // Fetch rentals with deposits that need to be processed
      const { data: pendingRentals, error: pendingError } = await supabase
        .from("rentals")
        .select(`
          id,
          shop_id,
          user_id,
          vehicle_id,
          start_date,
          end_date,
          status,
          deposit_required,
          deposit_paid,
          deposit_amount,
          deposit_processed,
          created_at,
          shop:shop_id(id, name, owner_id),
          vehicle:vehicle_id(id, name),
          user:user_id(id, email, first_name, last_name)
        `)
        .eq("deposit_required", true)
        .eq("deposit_paid", true)
        .eq("deposit_processed", false)
        .in("status", ["no_show", "cancelled"])
        .order("created_at", { ascending: false });

      if (pendingError) {
        console.error("Error fetching pending rentals:", pendingError);
        throw new Error(pendingError.message);
      }

      console.log("Pending rentals:", pendingRentals);

      // Fetch existing payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from("deposit_payouts")
        .select(`
          id,
          rental_id,
          shop_id,
          amount,
          status,
          reason,
          payment_reference,
          payment_method,
          payment_date,
          created_at,
          rental:rental_id(
            id,
            shop_id,
            user_id,
            vehicle_id,
            start_date,
            end_date,
            status,
            deposit_amount,
            shop:shop_id(id, name, owner_id),
            vehicle:vehicle_id(id, name),
            user:user_id(id, email, first_name, last_name)
          )
        `)
        .eq("status", filterStatus === "all" ? "completed" : filterStatus)
        .order("created_at", { ascending: false });

      if (payoutsError) {
        console.error("Error fetching payouts:", payoutsError);
        throw new Error(payoutsError.message);
      }

      console.log("Completed payouts:", payouts);

      // Filter by search term if provided
      let filteredPending = pendingRentals || [];
      let filteredPayouts = payouts || [];

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredPending = pendingRentals.filter(rental =>
          rental.id.toLowerCase().includes(term) ||
          rental.shop?.name.toLowerCase().includes(term) ||
          rental.vehicle?.name.toLowerCase().includes(term) ||
          rental.user?.email.toLowerCase().includes(term) ||
          `${rental.user?.first_name} ${rental.user?.last_name}`.toLowerCase().includes(term)
        );

        filteredPayouts = payouts.filter(payout =>
          payout.id.toLowerCase().includes(term) ||
          payout.rental_id.toLowerCase().includes(term) ||
          payout.rental?.shop?.name.toLowerCase().includes(term) ||
          payout.rental?.vehicle?.name.toLowerCase().includes(term) ||
          payout.rental?.user?.email.toLowerCase().includes(term) ||
          `${payout.rental?.user?.first_name} ${payout.rental?.user?.last_name}`.toLowerCase().includes(term)
        );
      }

      setPendingPayouts(filteredPending);
      setCompletedPayouts(filteredPayouts);
    } catch (error: any) {
      console.error("Error fetching payouts:", error);
      toast.error("Failed to load payouts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (rentalId: string, reason: string = "Customer no-show") => {
    try {
      setProcessingId(rentalId);
      console.log("Processing payout for rental:", rentalId);

      const response = await fetch("/api/admin/process-deposit-payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rentalId,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payout");
      }

      toast.success("Deposit payout processed successfully");
      fetchPayouts(); // Refresh the list
    } catch (error: any) {
      console.error("Error processing payout:", error);
      toast.error("Failed to process payout: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpandRental = (rentalId: string) => {
    if (expandedRental === rentalId) {
      setExpandedRental(null);
    } else {
      setExpandedRental(rentalId);
    }
  };

  if (loading && pendingPayouts.length === 0 && completedPayouts.length === 0) {
    return (
      <div className="p-6 flex justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
          <p className="text-white/70">Loading deposit payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Deposit Payout Manager</h2>
        <p className="text-white/70">
          Process deposit payouts for no-show bookings and cancelled rentals
        </p>
      </div>

      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
          <input
            type="text"
            placeholder="Search by ID, shop, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="all">All</option>
            </select>
          </div>
          <Button
            onClick={() => fetchPayouts()}
            variant="outline"
            className="px-3"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Pending Payouts Section */}
      {filterStatus === "pending" || filterStatus === "all" ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock size={18} className="mr-2 text-yellow-500" />
            Pending Deposit Payouts
          </h3>

          {pendingPayouts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
              <p className="text-white/70">No pending deposit payouts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayouts.map((rental) => (
                <div
                  key={rental.id}
                  className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleExpandRental(rental.id)}
                  >
                    <div className="flex items-start gap-3 mb-3 sm:mb-0">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="text-yellow-500" size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{rental.vehicle?.name || "Vehicle"}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 capitalize">
                            {rental.status}
                          </span>
                        </div>
                        <p className="text-sm text-white/70">{rental.shop?.name || "Shop"}</p>
                        <p className="text-xs text-white/50">
                          Booked by: {rental.user?.first_name} {rental.user?.last_name} ({rental.user?.email})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium text-primary">₱{rental.deposit_amount?.toFixed(2)}</div>
                        <div className="text-xs text-white/50">
                          {format(new Date(rental.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="text-white/50">
                        {expandedRental === rental.id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedRental === rental.id && (
                    <div className="p-4 border-t border-white/10 bg-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Booking Details</h5>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between">
                              <span className="text-white/70">Booking ID:</span>
                              <span className="font-mono">{rental.id}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Dates:</span>
                              <span>
                                {format(new Date(rental.start_date), "MMM d")} - {format(new Date(rental.end_date), "MMM d, yyyy")}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Status:</span>
                              <span className="capitalize">{rental.status}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Deposit Amount:</span>
                              <span>₱{rental.deposit_amount?.toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-2">Shop Information</h5>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between">
                              <span className="text-white/70">Shop:</span>
                              <span>{rental.shop?.name}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Shop ID:</span>
                              <span className="font-mono">{rental.shop?.id}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={() => handleProcessPayout(rental.id)}
                          disabled={processingId === rental.id}
                          className="flex items-center"
                        >
                          {processingId === rental.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <DollarSign size={16} className="mr-2" />
                              Process Payout
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Completed Payouts Section */}
      {filterStatus === "completed" || filterStatus === "all" ? (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle size={18} className="mr-2 text-green-500" />
            Completed Deposit Payouts
          </h3>

          {completedPayouts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
              <p className="text-white/70">No completed deposit payouts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleExpandRental(payout.id)}
                  >
                    <div className="flex items-start gap-3 mb-3 sm:mb-0">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="text-green-500" size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{payout.rental?.vehicle?.name || "Vehicle"}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 capitalize">
                            Paid
                          </span>
                        </div>
                        <p className="text-sm text-white/70">{payout.rental?.shop?.name || "Shop"}</p>
                        <p className="text-xs text-white/50">
                          Payout ID: {payout.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium text-green-500">₱{payout.amount?.toFixed(2)}</div>
                        <div className="text-xs text-white/50">
                          {format(new Date(payout.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="text-white/50">
                        {expandedRental === payout.id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedRental === payout.id && (
                    <div className="p-4 border-t border-white/10 bg-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Payout Details</h5>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between">
                              <span className="text-white/70">Payout ID:</span>
                              <span className="font-mono">{payout.id}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Rental ID:</span>
                              <span className="font-mono">{payout.rental_id}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Amount:</span>
                              <span>₱{payout.amount?.toFixed(2)}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Status:</span>
                              <span className="capitalize">{payout.status}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Reason:</span>
                              <span>{payout.reason || "Not specified"}</span>
                            </p>
                            {payout.payment_reference && (
                              <p className="flex justify-between">
                                <span className="text-white/70">Reference:</span>
                                <span>{payout.payment_reference}</span>
                              </p>
                            )}
                            {payout.payment_method && (
                              <p className="flex justify-between">
                                <span className="text-white/70">Method:</span>
                                <span>{payout.payment_method}</span>
                              </p>
                            )}
                            {payout.payment_date && (
                              <p className="flex justify-between">
                                <span className="text-white/70">Date:</span>
                                <span>{format(new Date(payout.payment_date), "MMM d, yyyy")}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-2">Shop Information</h5>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between">
                              <span className="text-white/70">Shop:</span>
                              <span>{payout.rental?.shop?.name}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-white/70">Shop ID:</span>
                              <span className="font-mono">{payout.rental?.shop?.id}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
