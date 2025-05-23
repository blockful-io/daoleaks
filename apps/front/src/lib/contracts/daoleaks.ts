export const DAOLEAKS_CONTRACT_ADDRESS = import.meta.env.VITE_DAOLEAKS_CONTRACT_ADDRESS as `0x${string}`

export const DAOLEAKS_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_verifiers', type: 'address[]', internalType: 'address[]' },
      { name: '_storageRoot', type: 'bytes32', internalType: 'bytes32' },
      { name: '_blockNumber', type: 'uint256', internalType: 'uint256' },
      { name: '_timestamp', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getMessages',
    inputs: [
      { name: 'page', type: 'uint256', internalType: 'uint256' },
      { name: 'pageSize', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct DaoLeaks.Message[]',
        components: [
          { name: 'message', type: 'string', internalType: 'string' },
          { name: 'votingPowerLevel', type: 'uint224', internalType: 'uint224' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTotalMessages',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTotalPages',
    inputs: [{ name: 'pageSize', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'messages',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'message', type: 'string', internalType: 'string' },
      { name: 'votingPowerLevel', type: 'uint224', internalType: 'uint224' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getVotingPowerLevel',
    inputs: [{ name: 'level', type: 'uint8', internalType: 'uint8' }],
    outputs: [{ name: '', type: 'uint224', internalType: 'uint224' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'MessagePosted',
    inputs: [
      { name: 'message', type: 'string', indexed: false, internalType: 'string' },
      { name: 'votingPowerLevel', type: 'uint224', indexed: false, internalType: 'uint224' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  }
] as const

// Voting power level mappings based on the contract
export const VOTING_POWER_LEVELS = {
  0: 1_000n * 10n ** 18n,  // >1k
  1: 10_000n * 10n ** 18n, // >10k  
  2: 50_000n * 10n ** 18n  // >50k
} as const

// Helper function to convert voting power level to tier
export function votingPowerToTier(votingPowerLevel: bigint): '>100' | '>1k' | '>10k' | '>50k' {
  if (votingPowerLevel >= VOTING_POWER_LEVELS[2]) {
    return '>50k'
  } else if (votingPowerLevel >= VOTING_POWER_LEVELS[1]) {
    return '>10k'
  } else if (votingPowerLevel >= VOTING_POWER_LEVELS[0]) {
    return '>1k'
  } else {
    return '>1k' // fallback for any lower values
  }
} 