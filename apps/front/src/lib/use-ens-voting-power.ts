import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import type { VotingPowerTier } from '@/components/VotingPowerBadge'
import { serialise } from './proof/storage-proof'

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
  tierRawValue: number[] | undefined
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
    chainId: parseInt(import.meta.env.VITE_CHAIN_ID as string),
    query: {
      enabled: !!address,
    },
  })

  // Convert voting power from wei to ENS tokens (18 decimals)
  const votingPower = rawVotingPower ? Number(formatUnits(rawVotingPower, 18)) : undefined

  // Determine tier based on voting power (only if eligible)
  const getTierFromVotingPower = (power: number): VotingPowerTier | undefined => {
    return '>1k';
    if (power >= 50000) return '>50k'
    if (power >= 10000) return '>10k'
    if (power >= 1000) return '>1k'
    return undefined // No tier if less than 1000 voting power
  }

  const tiers = {
    '>50k': 50000n * 10n ** 18n,
    '>10k': 10000n * 10n ** 18n,
    '>1k': 1000n * 10n ** 18n,
  }

  const getTierRawValue = (tier: VotingPowerTier): number[] => {

    const threshold = tiers[tier]
    // Setup voting power threshold (using minimum threshold for >1k tier)
    const thresholdHex = threshold.toString(16).padStart(56, '0'); // pad to 28 bytes for uint224
    const packedThresholdHex = thresholdHex + "00000000"; // add 4 bytes of zeros for uint32
    const votingPowerThreshold = serialise('0x' + packedThresholdHex, true);

    return votingPowerThreshold
  }

  const isEligible = votingPower !== undefined && votingPower >= 500
  const tier = isEligible ? getTierFromVotingPower(votingPower) : undefined
  const tierRawValue = tier ? getTierRawValue(tier) : undefined

  return {
    votingPower,
    tier,
    tierRawValue,
    isLoading,
    error,
    isEligible,
  }
} 