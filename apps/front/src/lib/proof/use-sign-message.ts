// apps/front/src/lib/proof/sign-message.ts
import { hashTypedData, recoverPublicKey } from 'viem';
import { useSignTypedData } from 'wagmi';


// Define the types for the Message struct
const types = {
    Message: [
        { name: 'message', type: 'string' }
    ]
};

/**
 * Hooks for signing a message using wagmi
 */
export function useSignMessage({ name, version, chainId, verifyingContract }: { name: string, version: string, chainId: number, verifyingContract: `0x${string}` }) {
    const { isPending, signTypedData, data: signature, error } = useSignTypedData();

    const domain = {
        name,
        version,
        chainId,
        verifyingContract
    };

    /**
     * Sign a message using EIP-712 typed data
     * @param message The message to sign
     */
    const signMessage = (message: string) => {
        const value = {
            message
        };

        signTypedData({
            domain,
            types,
            primaryType: 'Message',
            message: value
        });
    };

    /**
     * Recover public key from current signature and message
     * @param message The original message that was signed
     * @returns The recovered public key if signature exists
     */
    const recoverPublicKeyFromSignature = async (message: string): Promise<string | null> => {
        if (!signature) return null;
        
        const messageHash = getMessageHash(message);
        return await signatureUtils.recoverPublicKey(signature, messageHash);
    };

    /**
     * Calculate the message hash for a given message
     * @param message The message to hash
     * @returns The typed data hash
     */
    const getMessageHash = (message: string): `0x${string}` => {
        return hashTypedData({
            domain,
            types,
            primaryType: 'Message',
            message: {
                message
            }
        });
    };

    return {
        signMessage,
        signature,
        getMessageHash,
        isLoading: isPending,
        error,
        recoverPublicKeyFromSignature
    };
}

/**
 * Utility functions for handling signatures
 */
export const signatureUtils = {
    /**
     * Remove the recovery byte (last 2 characters) from a signature
     * @param signature The full signature with recovery byte
     * @returns The signature without recovery byte (64 bytes)
     */
    removeRecoveryByte: (signature: string): string => {
        return signature.slice(0, -2);
    },

    /**
     * Get the message hash using EIP-712 typed data format
     * @param message The message to hash
     * @returns The typed data hash
     */
    getMessageHash: (message: string, domain: { name: string, version: string, chainId: number, verifyingContract: `0x${string}` }): `0x${string}` => {
        return hashTypedData({
            domain,
            types,
            primaryType: 'Message',
            message: {
                message
            }
        });
    },

    /**
     * Recover the public key from a signature and message hash
     * @param signature The full signature with recovery byte
     * @param messageHash The hash of the message that was signed
     * @returns The recovered public key (full 64 bytes without the prefix)
     */
    recoverPublicKey: async (signature: string, messageHash: `0x${string}`): Promise<string> => {
        const publicKey = await recoverPublicKey({
            hash: messageHash,
            signature: signature as `0x${string}`
        });

        // Remove the '0x04' prefix to get the 64-byte (128 hex char) key
        return `0x${publicKey.slice(4, 132)}` as `0x${string}`;
    }
};