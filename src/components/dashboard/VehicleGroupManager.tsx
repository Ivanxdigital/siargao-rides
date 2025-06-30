"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VehicleGroup, VehicleGroupSettings } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const groupSettingsSchema = z.object({
  auto_assign_strategy: z.enum(['sequential', 'random', 'least_used']),
  naming_pattern: z.string().min(1, 'Naming pattern is required'),
  share_images: z.boolean(),
  share_pricing: z.boolean(),
  share_specifications: z.boolean(),
})

const bulkPricingSchema = z.object({
  price_per_day: z.number().min(1, 'Daily price must be at least 1'),
  price_per_week: z.number().optional(),
  price_per_month: z.number().optional(),
})

interface VehicleGroupManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: VehicleGroup & { settings?: VehicleGroupSettings }
  onUpdateSettings: (settings: Partial<VehicleGroupSettings>) => Promise<void>
  onUpdatePricing: (pricing: { price_per_day: number; price_per_week?: number; price_per_month?: number }) => Promise<void>
  onBlockDates: (dates: { start_date: string; end_date: string; reason?: string }) => Promise<void>
}

export function VehicleGroupManager({
  open,
  onOpenChange,
  group,
  onUpdateSettings,
  onUpdatePricing,
  onBlockDates
}: VehicleGroupManagerProps) {
  const [activeTab, setActiveTab] = useState('settings')
  const [isLoading, setIsLoading] = useState(false)

  const settingsForm = useForm<z.infer<typeof groupSettingsSchema>>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      auto_assign_strategy: group.settings?.auto_assign_strategy || 'sequential',
      naming_pattern: group.settings?.naming_pattern || 'Unit {index}',
      share_images: group.settings?.share_images ?? true,
      share_pricing: group.settings?.share_pricing ?? true,
      share_specifications: group.settings?.share_specifications ?? true,
    }
  })

  const pricingForm = useForm<z.infer<typeof bulkPricingSchema>>({
    resolver: zodResolver(bulkPricingSchema),
    defaultValues: {
      price_per_day: 0,
      price_per_week: undefined,
      price_per_month: undefined,
    }
  })

  const handleSettingsSubmit = async (values: z.infer<typeof groupSettingsSchema>) => {
    setIsLoading(true)
    try {
      await onUpdateSettings(values)
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePricingSubmit = async (values: z.infer<typeof bulkPricingSchema>) => {
    setIsLoading(true)
    try {
      await onUpdatePricing(values)
      pricingForm.reset()
    } catch (error) {
      console.error('Error updating pricing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Vehicle Group: {group.name}</DialogTitle>
          <DialogDescription>
            Configure settings and perform bulk operations on all {group.total_quantity} vehicles in this group.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="pricing">Bulk Pricing</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-4">
                <FormField
                  control={settingsForm.control}
                  name="auto_assign_strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Assignment Strategy</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignment strategy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sequential">
                            Sequential (Unit 1, 2, 3...)
                          </SelectItem>
                          <SelectItem value="random">
                            Random Selection
                          </SelectItem>
                          <SelectItem value="least_used">
                            Least Used First
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How vehicles are assigned from this group when customers book
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="naming_pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Naming Pattern</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Unit {index}" />
                      </FormControl>
                      <FormDescription>
                        Use {'{index}'} for unit number, {'{name}'} for vehicle name
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Shared Attributes</h4>
                  
                  <FormField
                    control={settingsForm.control}
                    name="share_images"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Share Images</FormLabel>
                          <FormDescription>
                            All units use the same images
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="share_pricing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Share Pricing</FormLabel>
                          <FormDescription>
                            All units have the same prices
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="share_specifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Share Specifications</FormLabel>
                          <FormDescription>
                            All units have the same specs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  Save Settings
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Update pricing for all vehicles in this group at once. This will only work if "Share Pricing" is enabled in settings.
              </AlertDescription>
            </Alert>

            <Form {...pricingForm}>
              <form onSubmit={pricingForm.handleSubmit(handlePricingSubmit)} className="space-y-4">
                <FormField
                  control={pricingForm.control}
                  name="price_per_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Day</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Daily rental price for all units
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={pricingForm.control}
                  name="price_per_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Week (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Weekly rental price (leave empty for no weekly rate)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={pricingForm.control}
                  name="price_per_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Month (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Monthly rental price (leave empty for no monthly rate)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading}>
                  Update All Prices
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="availability" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Block dates for maintenance or other reasons. This will make all vehicles in the group unavailable for the selected dates.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Date blocking functionality will be implemented here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}