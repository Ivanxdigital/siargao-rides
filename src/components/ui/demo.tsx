import FlipTextReveal from "@/components/ui/next-reveal"

export default function DemoOne() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-black p-4 transition-colors duration-300">
      <div className="w-full max-w-3xl">
        <FlipTextReveal word="NEXT LEVEL" />
      </div>
    </div>
  )
}
