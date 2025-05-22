import { Badge } from '@/components/ui/badge'

export type VotingPowerTier = '>1k' | '>10k' | '>50k'

interface VotingPowerBadgeProps {
  tier: VotingPowerTier
  className?: string
}

export function VotingPowerBadge({ tier, className = '' }: VotingPowerBadgeProps) {
  const getVotingPowerColor = (votingPower: VotingPowerTier) => {
    switch (votingPower) {
      case '>50k':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case '>10k':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case '>1k':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  return (
    <Badge 
      className={`${getVotingPowerColor(tier)} font-mono text-sm ${className}`}
    >
      {tier} voting power
    </Badge>
  )
}

// Helper function to get all valid voting power tiers
export const VOTING_POWER_TIERS: VotingPowerTier[] = ['>1k', '>10k', '>50k']

// Helper function to get a random tier (for demo purposes)
export const getRandomVotingPowerTier = (): VotingPowerTier => {
  return VOTING_POWER_TIERS[Math.floor(Math.random() * VOTING_POWER_TIERS.length)]
} 