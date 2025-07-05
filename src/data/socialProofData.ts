export interface SocialProofData {
  id: string
  name: string
  destination: string
  timeAgo: string
  service: 'airport-transfer' | 'van-hire'
  groupSize: number
}

const destinations = [
  'General Luna',
  'Cloud 9',
  'Pacifico',
  'Santa Monica',
  'Burgos',
  'Dapa',
  'Pilar',
  'Socorro'
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

const services: Array<SocialProofData['service']> = ['airport-transfer', 'van-hire']

export function generateSocialProofData(): SocialProofData[] {
  const data: SocialProofData[] = []
  
  for (let i = 0; i < 50; i++) {
    const name = names[Math.floor(Math.random() * names.length)]
    const destination = destinations[Math.floor(Math.random() * destinations.length)]
    const timeAgo = timeRanges[Math.floor(Math.random() * timeRanges.length)]
    const service = services[Math.floor(Math.random() * services.length)]
    const groupSize = Math.floor(Math.random() * 6) + 1 // 1-6 people
    
    data.push({
      id: `social-proof-${i}`,
      name,
      destination,
      timeAgo,
      service,
      groupSize
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