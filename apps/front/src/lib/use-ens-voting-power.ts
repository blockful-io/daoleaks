import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import type { VotingPowerTier } from '@/components/VotingPowerBadge'

// Token contract address
const contractAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS as `0x${string}`

// ERC20Votes ABI for getVotes function (voting power through delegation)
const ERC20_VOTES_ABI = [
  {
    name: 'getVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'votes', type: 'uint256' }],
  },
] as const

export interface ENSVotingPowerResult {
  votingPower: number | undefined
  tier: VotingPowerTier | undefined
  isLoading: boolean
  error: Error | null
  isEligible: boolean
}

export function useENSVotingPower(address?: `0x${string}`): ENSVotingPowerResult {
  const {
    data: rawVotingPower,
    isLoading,
    error,
  } = useReadContract({
    address: contractAddress,
    abi: ERC20_VOTES_ABI,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    chainId: import.meta.env.VITE_CHAIN_ID as number,
    query: {
      enabled: !!address,
    },
  })

  // Convert voting power from wei to ENS tokens (18 decimals)
  const votingPower = rawVotingPower ? Number(formatUnits(rawVotingPower, 18)) : undefined
  
  // Determine tier based on voting power (only if eligible)
  const getTierFromVotingPower = (power: number): VotingPowerTier | undefined => {
    if (power >= 50000) return '>50k'
    if (power >= 10000) return '>10k'
    if (power >= 1000) return '>1k'
    return undefined // No tier if less than 1000 voting power
  }

  const isEligible = votingPower !== undefined && votingPower >= 500
  const tier = isEligible ? getTierFromVotingPower(votingPower) : undefined

  return {
    votingPower,
    tier,
    isLoading,
    error,
    isEligible,
  }
} 