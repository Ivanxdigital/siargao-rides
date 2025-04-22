import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"

interface ReviewDialogProps {
  shopId: string
  onReviewSubmitted: () => void
  isUpdate?: boolean
  existingReview?: {
    id: string
    rating: number
    comment: string
  }
}

export function ReviewDialog({
  shopId,
  onReviewSubmitted,
  isUpdate = false,
  existingReview
}: ReviewDialogProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [comment, setComment] = useState(existingReview?.comment || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to leave a review")
      return
    }
    
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }
    
    try {
      setIsSubmitting(true)
      const supabase = createClientComponentClient()
      
      if (isUpdate && existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReview.id)
        
        if (error) throw error
        toast.success("Your review has been updated!")
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            shop_id: shopId,
            user_id: user.id,
            rating,
            comment,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (error) throw error
        toast.success("Thank you for your review!")
      }
      
      setOpen(false)
      onReviewSubmitted()
    } catch (error: any) {
      console.error("Error submitting review:", error)
      toast.error(error.message || "Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isUpdate ? "outline" : "default"} size="sm">
          {isUpdate ? "Edit Your Review" : "Write a Review"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-950 border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isUpdate ? "Update Your Review" : "Share Your Experience"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center">
            <p className="text-sm text-white/70 mb-2">How would you rate your experience?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= rating 
                        ? "text-tropical-yellow fill-tropical-yellow" 
                        : "text-white/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Your Comments
            </label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this shop..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-black/50 border-white/10"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting..." : isUpdate ? "Update Review" : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 