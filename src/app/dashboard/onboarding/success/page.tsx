import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { CheckCircle2, ArrowRight, Bike, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShopTrustBadge } from "@/components/shop/ShopTrustBadge";

export default async function OnboardingSuccessPage({
  searchParams,
}: {
  searchParams: { step?: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/sign-in?intent=shop_owner");
  }

  const role = session.user.user_metadata?.role;
  if (role !== "shop_owner") {
    redirect("/dashboard");
  }

  const { data: shop } = await supabase
    .from("rental_shops")
    .select("id, name, username, is_verified, status, is_active")
    .eq("owner_id", session.user.id)
    .eq("is_active", true)
    .maybeSingle();

  const shopUrl = shop?.username ? `/shop/${shop.username}` : shop ? `/shop/${shop.id}` : null;

  const { count: vehicleCount } = shop?.id
    ? await supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shop.id)
    : { count: null };

  const step = searchParams?.step === "vehicle" ? "vehicle" : "shop";
  const title = step === "vehicle" ? "Your vehicle is live" : "Your shop is live";

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <Badge className="mb-3 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                You&apos;re live
              </Badge>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-gray-300 mt-2">
                Listings can appear publicly right away. Verification is optional and can be done later.
              </p>
            </div>

            {shop && (
              <div className="bg-black/30 border border-white/10 rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-white/70">Shop</p>
                  <p className="font-medium truncate">{shop.name}</p>
                </div>
                <ShopTrustBadge isVerified={shop.is_verified} />
              </div>
            )}

            <div className="grid gap-3">
              <Button asChild className="w-full bg-primary hover:bg-primary/80">
                <Link href="/dashboard/vehicles/add?onboarding=1">
                  <Bike className="mr-2 h-4 w-4" />
                  {vehicleCount && vehicleCount > 0 ? "Add another vehicle" : "Add your first vehicle"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                <Link href="/dashboard/vehicles">
                  Manage vehicles
                </Link>
              </Button>

              {shopUrl && (
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href={shopUrl}>
                    <Store className="mr-2 h-4 w-4" />
                    View public shop page
                  </Link>
                </Button>
              )}

              <p className="text-xs text-center text-white/60 mt-4">
                Want the Verified badge? Upload documents later from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

