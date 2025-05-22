import { pad, concat, keccak256, toHex, hexToBigInt, type PublicClient } from "viem";

import { ok, err } from 'neverthrow';

type StorageProof = {
    storage_proof: number[];
    storage_key: number[]
    value: number[]
    storage_root: number[]
}

export function serialise(val: string, pad: boolean = false) {
    let x = val.replace("0x", "")
    if (pad && x.length < 64) {
        x = x.padStart(64, '0')
    }
    const result = Array.from(Buffer.from(x, "hex"))
    return result;
}

function calculateMappingSlot(address: string, mappingSlot: number): `0x${string}` {
    // Pad address to 32 bytes
    const paddedAddress = pad(address as `0x${string}`, { size: 32 });

    // Pad slot to 32 bytes
    const paddedSlot = pad(toHex(mappingSlot), { size: 32 });

    // Concatenate and hash
    const concatenated = concat([paddedAddress, paddedSlot]);
    const slot = keccak256(concatenated);

    return slot;
}

function calculateArrayElementSlot(arraySlot: `0x${string}`, index: number): `0x${string}` {
    // In Solidity, array elements are stored at: keccak256(arraySlot) + index
    const baseSlot = keccak256(arraySlot);
    const indexBigInt = BigInt(index);
    const elementSlotBigInt = hexToBigInt(baseSlot) + indexBigInt;
    const elementSlot = `0x${elementSlotBigInt.toString(16)}` as `0x${string}`;

    return elementSlot;
}

function createSerialsFromProof(proofResponse: {
    storageHash: string;
    storageProof: Array<{
        key: string;
        value: string;
        proof: string[];
    }>;
}): StorageProof[] {
    const MAX_TRIE_NODE_LENGTH = 532;

    return proofResponse.storageProof.map(proofItem => {
        // Create proof path string by padding and concatenating all proof elements
        let proofPath: string = "";
        for (let layer of proofItem.proof) {
            layer = layer.replace("0x", "").padEnd(MAX_TRIE_NODE_LENGTH * 2, '0');
            proofPath = proofPath + layer;
        }

        return {
            storage_proof: serialise(proofPath),
            storage_key: serialise(proofItem.key),
            value: serialise(proofItem.value, true),
            storage_root: serialise(proofResponse.storageHash)
        };
    });
}

export async function getStorageProof(client: PublicClient, contractAddress: `0x${string}`, calculatedMappingSlotForKey: `0x${string}`, blockNumber: `0x${string}`) {
    const arrayLengthRes = await client.request({
        method: 'eth_getProof',
        params: [
            contractAddress,
            [calculatedMappingSlotForKey],
            blockNumber
        ]
    });

    if (arrayLengthRes.storageProof.length === 0) {
        return err(new Error("No proof found"));
    }

    return ok(arrayLengthRes);
}


/**
 * @notice Retrieves storage proof for the latest checkpoint of an account from a contract's mapping of dynamic arrays
 * @dev This function performs multiple storage proof queries:
 *      1. Gets proof for the mapping slot to determine array length
 *      2. Calculates the storage location of the last array element (latest checkpoint)
 *      3. Gets proof for that checkpoint value
 *      The function assumes the contract stores account data as mapping(address => Checkpoint[])
 * @param client The PublicClient instance for making RPC calls
 * @param accountAddress The account address to get checkpoint data for
 * @param contractAddress The contract address containing the mapping
 * @param mappingSlot The storage slot number where the mapping is stored in the contract
 * @param blockNumber The block number to query the storage state at (in hex format)
 * @return Promise that resolves to either:
 *         - Success: Object containing storage_proof data, depth, and padded values
 *         - Error: When array is empty, checkpoint uninitialized, or proof not found
 */
export async function getStorageProofForAccount(client: PublicClient, accountAddress: `0x${string}`, contractAddress: `0x${string}`, mappingSlot: number, blockNumber: `0x${string}`) {
    const calculatedMappingSlotForKey = calculateMappingSlot(accountAddress, mappingSlot);
    console.log('blockNumber', blockNumber);
    const arrayLocationRes = await getStorageProof(client, contractAddress, calculatedMappingSlotForKey, blockNumber);

    if (arrayLocationRes.isErr()) {
        return err(arrayLocationRes.error);
    }

    const arrayLengthProof = arrayLocationRes.value.storageProof[0];

    const arrayLength = hexToBigInt(arrayLengthProof.value);

    if (arrayLength === 0n) {
        return err(new Error("Array is empty, no checkpoints to fetch."));
    }

    // always fetch the last checkpoint
    const indexToFetch = Number(arrayLength) - 1

    // Calculate the base slot for array data
    // For dynamic arrays, elements are stored at keccak256(slot) + index
    const arrayElementSlot = calculateArrayElementSlot(calculatedMappingSlotForKey, indexToFetch);

    const checkpointLocationRes = await getStorageProof(client, contractAddress, arrayElementSlot, blockNumber);

    if (checkpointLocationRes.isErr()) {
        return err(checkpointLocationRes.error);
    }

    const checkpointValue = checkpointLocationRes.value.storageProof[0].value;

    if (checkpointValue === "0x0") {
        return err(new Error("Checkpoint value not initialized"));
    }

    const depth = checkpointLocationRes.value.storageProof[0].proof.length;

    const checkpointProofData = createSerialsFromProof(checkpointLocationRes.value)[0];

    // Convert array index to padded bytes
    const indexBytes = pad(toHex(indexToFetch), { size: 32 });
    const paddedArrayIndex = serialise(indexBytes);

    // Convert mapping slot to padded bytes
    const mappingSlotBytes = pad(toHex(mappingSlot), { size: 32 });
    const paddedMappingSlot = serialise(mappingSlotBytes);

    return ok({
        storage_proof: {
            storage_proof: checkpointProofData.storage_proof,
            value: checkpointProofData.value,
            storage_root: checkpointProofData.storage_root,
            padded_mapping_slot: paddedMappingSlot,
            padded_array_index: paddedArrayIndex,
        },
        depth
    });
}