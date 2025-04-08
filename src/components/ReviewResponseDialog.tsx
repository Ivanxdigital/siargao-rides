import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { MessageCircle } from "lucide-react"
import { Textarea } from "@/components/ui/Textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"

interface ReviewResponseDialogProps {
  reviewId: string
  existingReply?: string
  onResponseSubmitted: () => void
}

export function ReviewResponseDialog({
  reviewId,
  existingReply,
  onResponseSubmitted
}: ReviewResponseDialogProps) {
  const [reply, setReply] = useState(existingReply || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  
  const handleSubmit = async () => {
    if (!reply.trim()) {
      toast.error("Please enter a response")
      return
    }
    
    try {
      setIsSubmitting(true)
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('reviews')
        .update({
          reply,
          reply_date: new Date().toISOString()
        })
        .eq('id', reviewId)
      
      if (error) throw error
      
      toast.success("Your response has been submitted")
      setOpen(false)
      onResponseSubmitted()
    } catch (error: any) {
      console.error("Error submitting response:", error)
      toast.error(error.message || "Failed to submit response")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-primary/30 hover:bg-primary/10 text-primary hover:text-primary"
        >
          <MessageCircle size={14} className="mr-1" />
          {existingReply ? "Edit Response" : "Respond"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-950 border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {existingReply ? "Edit Your Response" : "Respond to Customer Review"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="reply" className="block text-sm font-medium mb-2">
              Your Response
            </label>
            <Textarea
              id="reply"
              placeholder="Thank the customer for their feedback or address their concerns..."
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
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
            {isSubmitting ? "Submitting..." : "Post Response"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 