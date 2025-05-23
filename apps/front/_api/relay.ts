import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { z } from 'zod';

// Complete contract ABI from compiled artifact
const contractAbi = [
  {
    "type": "constructor",
    "inputs": [
      {"name": "_verifiers", "type": "address[]", "internalType": "address[]"},
      {"name": "_storageRoot", "type": "bytes32", "internalType": "bytes32"},
      {"name": "_blockNumber", "type": "uint256", "internalType": "uint256"},
      {"name": "_timestamp", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addStorageRoot",
    "inputs": [
      {"name": "storageRoot", "type": "bytes32", "internalType": "bytes32"},
      {"name": "blockNumber", "type": "uint256", "internalType": "uint256"},
      {"name": "timestamp", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "generatePublicInputs",
    "inputs": [
      {"name": "message", "type": "string", "internalType": "string"},
      {"name": "votingPowerLevel", "type": "uint224", "internalType": "uint224"},
      {"name": "storageRoot", "type": "bytes32", "internalType": "bytes32"}
    ],
    "outputs": [{"name": "", "type": "bytes32[]", "internalType": "bytes32[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLastStorageRoot",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "bytes32", "internalType": "bytes32"},
      {"name": "", "type": "uint256", "internalType": "uint256"},
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMessages",
    "inputs": [
      {"name": "page", "type": "uint256", "internalType": "uint256"},
      {"name": "pageSize", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct DaoLeaks.Message[]",
        "components": [
          {"name": "message", "type": "string", "internalType": "string"},
          {"name": "votingPowerLevel", "type": "uint224", "internalType": "uint224"},
          {"name": "timestamp", "type": "uint256", "internalType": "uint256"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStorageRoot",
    "inputs": [{"name": "storageRoot", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [
      {"name": "", "type": "bytes32", "internalType": "bytes32"},
      {"name": "", "type": "uint256", "internalType": "uint256"},
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalMessages",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalPages",
    "inputs": [{"name": "pageSize", "type": "uint256", "internalType": "uint256"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVotingPowerLevel",
    "inputs": [{"name": "level", "type": "uint8", "internalType": "uint8"}],
    "outputs": [{"name": "", "type": "uint224", "internalType": "uint224"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hashMessage",
    "inputs": [{"name": "message", "type": "string", "internalType": "string"}],
    "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lastStorageRoot",
    "inputs": [],
    "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "messages",
    "inputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "outputs": [
      {"name": "message", "type": "string", "internalType": "string"},
      {"name": "votingPowerLevel", "type": "uint224", "internalType": "uint224"},
      {"name": "timestamp", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "postMessage",
    "inputs": [
      {"name": "proof", "type": "bytes", "internalType": "bytes"},
      {"name": "message", "type": "string", "internalType": "string"},
      {"name": "votingPowerLevel", "type": "uint8", "internalType": "uint8"},
      {"name": "storageProofDepth", "type": "uint256", "internalType": "uint256"},
      {"name": "storageRoot", "type": "bytes32", "internalType": "bytes32"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "storageRootMaxAge",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "storageRoots",
    "inputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [
      {"name": "storageRoot", "type": "bytes32", "internalType": "bytes32"},
      {"name": "blockNumber", "type": "uint256", "internalType": "uint256"},
      {"name": "timestamp", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "verifiers",
    "inputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "outputs": [{"name": "", "type": "address", "internalType": "contract HonkVerifier"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "votingPowerLevels",
    "inputs": [{"name": "", "type": "uint8", "internalType": "uint8"}],
    "outputs": [{"name": "", "type": "uint224", "internalType": "uint224"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "MessagePosted",
    "inputs": [
      {"name": "message", "type": "string", "indexed": false, "internalType": "string"},
      {"name": "votingPowerLevel", "type": "uint224", "indexed": false, "internalType": "uint224"},
      {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  }
] as const;

// Zod schema for payload validation
const RelayPayloadSchema = z.object({
  storageRoot: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid storage root format (must be 32-byte hex string)'),
  blockNumber: z.union([z.number(), z.bigint(), z.string()]).transform((val) => BigInt(val)),
  timestamp: z.union([z.number(), z.bigint(), z.string()]).transform((val) => BigInt(val)),
  proof: z.string().regex(/^0x[a-fA-F0-9]*$/, 'Invalid proof format (must be hex string)'),
  message: z.string().min(1, 'Message cannot be empty'),
  votingPowerLevel: z.number().int().min(0).max(2, 'Voting power level must be 0, 1, or 2'),
  storageProofDepth: z.union([z.number(), z.bigint(), z.string()]).transform((val) => BigInt(val)),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse and validate the request payload
    const rawPayload = req.body;
    const parseResult = RelayPayloadSchema.safeParse(rawPayload);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid payload', 
        details: parseResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      });
    }

    const payload = parseResult.data;

    // Get environment variables
    const rpcUrl = process.env.VITE_RPC_URL || 'https://sepolia.base.org';
    const contractAddress = process.env.VITE_DAOLEAKS_CONTRACT_ADDRESS as `0x${string}`;
    const privateKey = process.env.RELAY_PRIVATE_KEY as `0x${string}`;

    if (!contractAddress || !privateKey) {
      return res.status(500).json({ 
        error: 'Missing contract address or private key configuration' 
      });
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // Transaction 1: addStorageRoot
    const addStorageRootHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'addStorageRoot',
      args: [
        payload.storageRoot as `0x${string}`,
        payload.blockNumber,
        payload.timestamp
      ],
    });

    // Wait for the first transaction to be confirmed
    const addStorageRootReceipt = await publicClient.waitForTransactionReceipt({
      hash: addStorageRootHash,
    });

    // Transaction 2: postMessage
    const postMessageHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'postMessage',
      args: [
        payload.proof as `0x${string}`,
        payload.message,
        payload.votingPowerLevel,
        payload.storageProofDepth,
        payload.storageRoot as `0x${string}`
      ],
    });

    console.log('tx args', [
      payload.proof as `0x${string}`,
      payload.message,
      payload.votingPowerLevel,
      payload.storageProofDepth,
      payload.storageRoot as `0x${string}`
    ])

    // Wait for the second transaction to be confirmed
    const postMessageReceipt = await publicClient.waitForTransactionReceipt({
      hash: postMessageHash,
    });

    // Return success response with transaction details
    return res.status(200).json({
      success: true,
      transactions: {
        addStorageRoot: {
          hash: addStorageRootHash,
          blockNumber: addStorageRootReceipt.blockNumber,
          gasUsed: addStorageRootReceipt.gasUsed,
        },
        postMessage: {
          hash: postMessageHash,
          blockNumber: postMessageReceipt.blockNumber,
          gasUsed: postMessageReceipt.gasUsed,
        },
      },
    });

  } catch (error) {
    console.error('Relay endpoint error:', error);
    
    return res.status(500).json({
      error: 'Transaction failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}