import { recoverPublicKey, hexToBytes } from 'viem';

/**
 * Convert EIP-712 signature and message hash to noir inputs format
 */
export async function convertSignatureToNoirInputs(
  signature: string,
  messageHash: `0x${string}`
): Promise<{
  public_key: number[];
  message_hash: number[];
  signature: number[];
}> {
  // Recover the public key from the signature
  const publicKey = await recoverPublicKey({
    hash: messageHash,
    signature: signature as `0x${string}`
  });

  // Extract the 64-byte public key (without 0x04 prefix)
  const publicKeyFull = `0x${publicKey.slice(4, 132)}` as `0x${string}`;

  // Extract r and s from signature (remove v byte at the end)
  const signatureWithoutV = signature.slice(0, -2);
  const rHex = signatureWithoutV.slice(0, 66); // 0x + 32 bytes
  const sHex = `0x${signatureWithoutV.slice(66)}` as `0x${string}`; // remaining 32 bytes

  // Convert to byte arrays for noir
  const signature_r = hexToBytes(rHex as `0x${string}`);
  const signature_s = hexToBytes(sHex);
  const signature_64_bytes = [...signature_r, ...signature_s];

  return {
    public_key: Array.from(hexToBytes(publicKeyFull)),
    message_hash: Array.from(hexToBytes(messageHash)),
    signature: signature_64_bytes,
  };
} 