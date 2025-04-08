import { Star, MessageCircle } from "lucide-react"
import { ReviewResponseDialog } from "./ReviewResponseDialog"
import { Review } from "@/lib/types"

interface ReviewItemProps {
  review: Review
  isShopOwner: boolean | null | undefined
  onResponseSubmitted: () => void
}

export function ReviewItem({ review, isShopOwner, onResponseSubmitted }: ReviewItemProps) {
  // Add a boolean check to safely use isShopOwner
  const canRespond = !!isShopOwner;
  
  return (
    <div className="bg-black/60 backdrop-blur-sm border border-white/10 hover:border-primary/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {review.user_id.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">Customer</div>
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
              className={i < review.rating ? "text-tropical-yellow fill-tropical-yellow" : "text-white/30"} 
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