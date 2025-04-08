import { useState, useEffect } from "react"
import Image from "next/image"
import { Star, MessageCircle, User } from "lucide-react"
import { ReviewResponseDialog } from "./ReviewResponseDialog"
import { Review, ReviewWithDetails, User as UserType } from "@/lib/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface ReviewItemProps {
  review: Review | ReviewWithDetails
  isShopOwner: boolean | null | undefined
  onResponseSubmitted: () => void
}

export function ReviewItem({ review, isShopOwner, onResponseSubmitted }: ReviewItemProps) {
  // Add a boolean check to safely use isShopOwner
  const canRespond = !!isShopOwner;
  const [reviewUser, setReviewUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchUserData() {
      // If review already includes user data (ReviewWithDetails type), use that
      if ('user' in review && review.user) {
        setReviewUser(review.user as UserType);
        setLoading(false);
        return;
      }
      
      // Otherwise fetch the user data
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', review.user_id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
        } else if (data) {
          setReviewUser(data as UserType);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [review]);
  
  // Function to get user's first name or a fallback
  const getUserName = () => {
    if (reviewUser?.first_name) {
      return reviewUser.first_name;
    }
    return "Customer";
  };
  
  return (
    <div className="bg-black/60 backdrop-blur-sm border border-white/10 hover:border-primary/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {reviewUser?.avatar_url ? (
              <Image 
                src={reviewUser.avatar_url} 
                alt={getUserName()} 
                width={40} 
                height={40} 
                className="object-cover w-full h-full"
              />
            ) : (
              <User size={20} className="text-primary" />
            )}
          </div>
          <div>
            <div className="font-medium">{getUserName()}</div>
            <div className="text-xs text-white/50">
              {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center bg-yellow-900/20 px-2 py-1.5 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={16} 
              className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-white/30"} 
            />
          ))}
        </div>
      </div>
      
      <div className="bg-black/40 p-4 rounded-lg mb-4 relative">
        <div className="absolute -top-2 left-4 w-4 h-4 bg-black/40 rotate-45"></div>
        <p className="text-sm leading-relaxed">{review.comment || "No comment provided."}</p>
      </div>
      
      {/* Reply from shop owner */}
      {review.reply && (
        <div className="flex gap-3 mt-5 bg-primary/5 p-4 rounded-lg border-l-3 border-primary">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle size={14} className="text-primary" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-primary flex items-center gap-2">
              Shop Response
              <span className="text-xs text-white/50 font-normal">Official reply</span>
            </div>
            <p className="mt-1 text-sm">{review.reply}</p>
          </div>
        </div>
      )}
      
      {/* Response button for shop owners */}
      {canRespond && (
        <div className="mt-4 flex justify-end">
          <ReviewResponseDialog
            reviewId={review.id}
            existingReply={review.reply}
            onResponseSubmitted={onResponseSubmitted}
          />
        </div>
      )}
    </div>
  )
} 