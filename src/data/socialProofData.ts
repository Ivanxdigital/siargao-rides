export interface SocialProofData {
  id: string
  name?: string
  destination?: string
  timeAgo: string
  service: 'airport-transfer' | 'van-hire'
  groupSize?: number
  type: 'booking' | 'activity' | 'demand' | 'trend'
  message?: string
}

const destinations = [
  'General Luna',
  'Cloud 9',
  'Pacifico',
  'Santa Monica',
  'Burgos',
  'Dapa',
  'Union',
  'Catangnan'
]

const names = [
  'Sarah from Australia',
  'Mike & Lisa',
  'David from UK',
  'Emma & James',
  'Carlos from Spain',
  'Sophie from France',
  'Tom & Rachel',
  'Alex from Canada',
  'Jessica from USA',
  'Marco from Italy',
  'Anna from Germany',
  'Ryan & Kelly',
  'Lucas from Brazil',
  'Nina from Sweden',
  'Ben & Amy',
  'Zoe from Netherlands',
  'Jake from New Zealand',
  'Mia & Chris',
  'Sam from Singapore',
  'Lily from Japan'
]

// FOMO notification messages
const activityMessages = [
  '3 people pre-booked in the last 24 hours',
  '12 early pre-bookings this week',
  '7 travelers secured spots yesterday',
  '5 pre-bookings confirmed today'
]

const demandMessages = [
  'High demand for August 2025 transfers',
  '5 pre-bookings from General Luna area',
  '3 Cloud 9 transfers pre-booked today',
  'Growing interest in Pacifico transfers',
  '4 Santa Monica pre-bookings this week'
]

const trendMessages = [
  'Pre-booking momentum building',
  'Early-bird phase 23% complete',
  'First-week exceeded expectations',
  'Demand picking up for launch month',
  'Early adopters securing prime slots'
]

const timeRanges = [
  '25 minutes ago',
  '35 minutes ago',
  '45 minutes ago',
  '1 hour ago',
  '1.5 hours ago',
  '2 hours ago',
  '2.5 hours ago',
  '3 hours ago',
  '4 hours ago',
  '5 hours ago'
]

const fomoTimeRanges = [
  'just now',
  '15 minutes ago',
  '30 minutes ago',
  '1 hour ago',
  '2 hours ago',
  'today',
  'this week'
]

const services: Array<SocialProofData['service']> = ['airport-transfer', 'van-hire']

export function generateSocialProofData(): SocialProofData[] {
  const data: SocialProofData[] = []
  
  // Generate regular booking notifications (70%)
  for (let i = 0; i < 35; i++) {
    const name = names[Math.floor(Math.random() * names.length)]
    const destination = destinations[Math.floor(Math.random() * destinations.length)]
    const timeAgo = timeRanges[Math.floor(Math.random() * timeRanges.length)]
    const service = services[Math.floor(Math.random() * services.length)]
    const groupSize = Math.floor(Math.random() * 6) + 1 // 1-6 people
    
    data.push({
      id: `booking-${i}`,
      type: 'booking',
      name,
      destination,
      timeAgo,
      service,
      groupSize
    })
  }
  
  // Generate activity notifications (15%)
  for (let i = 0; i < 8; i++) {
    const message = activityMessages[Math.floor(Math.random() * activityMessages.length)]
    const timeAgo = fomoTimeRanges[Math.floor(Math.random() * fomoTimeRanges.length)]
    const service = services[Math.floor(Math.random() * services.length)]
    
    data.push({
      id: `activity-${i}`,
      type: 'activity',
      message,
      timeAgo,
      service
    })
  }
  
  // Generate demand notifications (10%)
  for (let i = 0; i < 5; i++) {
    const message = demandMessages[Math.floor(Math.random() * demandMessages.length)]
    const timeAgo = fomoTimeRanges[Math.floor(Math.random() * fomoTimeRanges.length)]
    const service = services[Math.floor(Math.random() * services.length)]
    
    data.push({
      id: `demand-${i}`,
      type: 'demand',
      message,
      timeAgo,
      service
    })
  }
  
  // Generate trend notifications (5%)
  for (let i = 0; i < 2; i++) {
    const message = trendMessages[Math.floor(Math.random() * trendMessages.length)]
    const timeAgo = fomoTimeRanges[Math.floor(Math.random() * fomoTimeRanges.length)]
    const service = services[Math.floor(Math.random() * services.length)]
    
    data.push({
      id: `trend-${i}`,
      type: 'trend',
      message,
      timeAgo,
      service
    })
  }
  
  return data
}

export function getRandomSocialProofItem(excludeIds: string[] = []): SocialProofData | null {
  const allData = generateSocialProofData()
  const availableData = allData.filter(item => !excludeIds.includes(item.id))
  
  if (availableData.length === 0) return null
  
  const randomIndex = Math.floor(Math.random() * availableData.length)
  return availableData[randomIndex]
}