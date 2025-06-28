"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Move, RotateCcw } from "lucide-react"

interface BannerPositionToolProps {
  bannerUrl: string | null
  initialX?: number
  initialY?: number
  onPositionChange: (x: number, y: number) => void
  className?: string
}

export default function BannerPositionTool({
  bannerUrl,
  initialX = 50,
  initialY = 50,
  onPositionChange,
  className = ""
}: BannerPositionToolProps) {
  const [positionX, setPositionX] = useState(initialX)
  const [positionY, setPositionY] = useState(initialY)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    handlePositionUpdate(e)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    handlePositionUpdate(e)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handlePositionUpdate = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    setPositionX(clampedX)
    setPositionY(clampedY)
    onPositionChange(clampedX, clampedY)
  }, [onPositionChange])

  const handleReset = () => {
    setPositionX(50)
    setPositionY(50)
    onPositionChange(50, 50)
  }

  const handleSliderChange = (axis: 'x' | 'y', value: number) => {
    if (axis === 'x') {
      setPositionX(value)
      onPositionChange(value, positionY)
    } else {
      setPositionY(value)
      onPositionChange(positionX, value)
    }
  }

  if (!bannerUrl) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move size={20} />
            Banner Position Control
          </CardTitle>
          <CardDescription>
            Upload a banner image first to adjust its position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
            No banner image available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move size={20} />
          Banner Position Control
        </CardTitle>
        <CardDescription>
          Click and drag on the preview to adjust the focal point of your banner
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interactive Preview */}
        <div className="space-y-2">
          <Label>Interactive Preview</Label>
          <div
            ref={containerRef}
            className="relative h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-crosshair border-2 border-gray-200 dark:border-gray-700"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Image
              src={bannerUrl}
              alt="Banner preview"
              fill
              className="object-cover"
              style={{
                objectPosition: `${positionX}% ${positionY}%`
              }}
            />
            {/* Crosshair indicator */}
            <div
              className="absolute w-3 h-3 border-2 border-white bg-primary rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${positionX}%`,
                top: `${positionY}%`
              }}
            />
            {/* Overlay with guidelines */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute w-full border-t border-white/30"
                style={{ top: `${positionY}%` }}
              />
              <div 
                className="absolute h-full border-l border-white/30"
                style={{ left: `${positionX}%` }}
              />
            </div>
          </div>
        </div>

        {/* Slider Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position-x">Horizontal Position</Label>
            <input
              id="position-x"
              type="range"
              min="0"
              max="100"
              value={positionX}
              onChange={(e) => handleSliderChange('x', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="text-xs text-gray-500 text-center">{positionX.toFixed(1)}%</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-y">Vertical Position</Label>
            <input
              id="position-y"
              type="range"
              min="0"
              max="100"
              value={positionY}
              onChange={(e) => handleSliderChange('y', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="text-xs text-gray-500 text-center">{positionY.toFixed(1)}%</div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset to Center
          </Button>
        </div>

        {/* Position Values */}
        <div className="text-xs text-gray-500 text-center">
          Position: {positionX.toFixed(1)}%, {positionY.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  )
}