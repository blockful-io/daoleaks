import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPublicClient, createWalletClient, http, parseAbi, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { z } from 'zod';

// Contract ABI for the mintAndDelegate function
const tokenAbi = parseAbi([
  'function mintAndDelegate(address dest, uint256 amount) external'
]);

// Zod schema for faucet payload validation
const FaucetPayloadSchema = z.object({
  account: z.string().refine((addr) => isAddress(addr), {
    message: 'Invalid Ethereum address format',
  }),
  value: z.union([z.number(), z.bigint(), z.string()]).transform((val) => BigInt(val)),
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
    const parseResult = FaucetPayloadSchema.safeParse(rawPayload);
    
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
    const tokenContractAddress = process.env.VITE_TOKEN_CONTRACT_ADDRESS;
    const privateKey = process.env.RELAY_PRIVATE_KEY;

    if (!tokenContractAddress || !privateKey) {
      return res.status(500).json({ 
        error: 'Missing token contract address or private key configuration' 
      });
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // Call mintAndDelegate function
    const mintAndDelegateHash = await walletClient.writeContract({
      address: tokenContractAddress as `0x${string}`,
      abi: tokenAbi,
      functionName: 'mintAndDelegate',
      args: [
        payload.account,
        payload.value
      ],
    });

    // Wait for the transaction to be confirmed
    const mintAndDelegateReceipt = await publicClient.waitForTransactionReceipt({
      hash: mintAndDelegateHash,
    });

    // Return success response with transaction details
    return res.status(200).json({
      success: true,
      transaction: {
        hash: mintAndDelegateHash,
        blockNumber: mintAndDelegateReceipt.blockNumber.toString(),
        gasUsed: mintAndDelegateReceipt.gasUsed.toString(),
        to: payload.account,
        amount: payload.value.toString(),
      },
    });

  } catch (error) {
    console.error('Faucet endpoint error:', error);
    
    return res.status(500).json({
      error: 'Faucet transaction failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
