import { UltraHonkBackend } from '@aztec/bb.js';
// @ts-ignore -- ESM import works at runtime despite TypeScript warning
import { Noir } from '@noir-lang/noir_js';
import { CompiledCircuit } from '@noir-lang/types';

import { keccak256, concat, pad, toHex, http, createPublicClient, hexToBigInt, hashTypedData, recoverPublicKey, toBytes, createWalletClient } from "viem";
import { baseSepolia, mainnet } from "viem/chains";

import fs from 'fs';
import path from 'path';
import { privateKeyToAccount } from 'viem/accounts';

type StorageProof = {
    storage_proof: number[];
    storage_key: number[]
    value: number[]
    storage_root: number[]
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

function serialise(val: string, pad: boolean = false) {
    let x = val.replace("0x", "")
    if (pad && x.length < 64) {
        x = x.padStart(64, '0')
    }
    const result = Array.from(Buffer.from(x, "hex"))
    return result;
}

// Calculate storage slot for mapping with address keys using viem
function calculateMappingSlot(address: string, mappingSlot: number): `0x${string}` {
    // Pad address to 32 bytes
    const paddedAddress = pad(address as `0x${string}`, { size: 32 });

    // Pad slot to 32 bytes
    const paddedSlot = pad(toHex(mappingSlot), { size: 32 });

    // Concatenate and hash
    const concatenated = concat([paddedAddress, paddedSlot]);
    const slot = keccak256(concatenated);

    console.log(`Mapping slot calculation: ${address} at slot ${mappingSlot} = ${slot}`);
    return slot;
}

// Calculate array element slot
function calculateArrayElementSlot(arraySlot: `0x${string}`, index: number): `0x${string}` {
    // In Solidity, array elements are stored at: keccak256(arraySlot) + index
    const baseSlot = keccak256(arraySlot);
    const indexBigInt = BigInt(index);
    const elementSlotBigInt = hexToBigInt(baseSlot) + indexBigInt;
    const elementSlot = `0x${elementSlotBigInt.toString(16)}` as `0x${string}`;

    console.log(`Array element slot calculation: array at ${arraySlot}, index ${index} = ${elementSlot}`);
    return elementSlot;
}

async function signMessage(message: string, privateKey: `0x${string}`) {
    // Create account from private key
    const account = privateKeyToAccount(privateKey);
    
    // Hash the typed data first
    const hash = hashTypedData({
        domain,
        types,
        primaryType: 'Message',
        message: {
            message: message
        }
    });

    // Sign the hash directly using the account's signMessage method
    const signature = await account.signMessage({
        message: { raw: hash }
    });

    return signature;
}

//hash data using EIP-712 structured data format
// Using the same types defined in the contract
const domain = {
    name: 'DaoLeaks',
    version: '1',
    chainId: 84532,
    verifyingContract: '0x65cC4D5f790dF736cD54d675d9280c056d640b22' as `0x${string}`
  };
  
  // Define the types for the Message struct
  const types = {
    Message: [
      { name: 'message', type: 'string' }
    ]
  };

// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
async function main() {

    // const BLOCK_NUMBER = 22524300;

    const client = createPublicClient({
        chain: mainnet,
        // transport: http("https://eth-mainnet.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5")
        transport: http("https://base-sepolia.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5")
    });


    // Replace the hard-coded block number with:
    const BLOCK_NUMBER = await client.getBlockNumber();
    console.log("BLOCK_NUMBER", BLOCK_NUMBER);

    // First, get the block to get the state root
    const block = await client.getBlock({ blockNumber: BigInt(BLOCK_NUMBER) });
    const stateRoot = block.stateRoot;
    console.log("State root at block", BLOCK_NUMBER, ":", stateRoot);


    // ENS token contract
    const contractAddress = "0x1C9039Be216f35291B2bCf67E5aB1F668db58Ac0";
    // Slot for _checkpoints mapping is 7
    const mappingSlot = 7;

    // Calculate the storage slot for our test account
    const delegateAccount = "0xCc5fccF9dd64b5E26bc3401407201BDB558C7619";
    // Sample tx from delegate to fetch signature from
    const msg = "Signed by Alice";

    const msgHash = hashTypedData({
        domain,
        types,
        primaryType: 'Message',
        message: {
          message: msg
        }
      });

    const privateKey = "0x69df72b7900cec6abe0c0d2e06638ca7ec08e7718bd676208cf046de6d2f6d6d";
    const signature = await signMessage(msgHash, privateKey);

    const account = privateKeyToAccount(privateKey)
    console.log("account.publicKey", account.publicKey)

    // const verifyMsgHash = keccak256(toBytes(msg));

    const signature_64_bytes = signature.slice(0, -2);


    const publicKey = await recoverPublicKey({
        hash: msgHash,
        signature: signature
    });
    const publicKeyFull = `0x${publicKey.slice(4, 132)}` as `0x${string}`;

    const calculatedMappingSlotForKey = calculateMappingSlot(delegateAccount, mappingSlot);
    console.log("calculatedSlot", calculatedMappingSlotForKey);

    const arrayLengthRes = await client.request({
        method: 'eth_getProof',
        params: [
            contractAddress,
            [calculatedMappingSlotForKey],
            toHex(BLOCK_NUMBER)
        ]
    });

    console.log({ contractAddress, calculatedMappingSlotForKey, blockNumber: toHex(BLOCK_NUMBER) });


    const arrayLengthProof = arrayLengthRes.storageProof[0];

    const arrayLength = hexToBigInt(arrayLengthProof.value);
    console.log(`Array length: ${arrayLength}`);

    // If array is empty, stop here
    if (arrayLength === 0n) {
        console.log("Array is empty, no checkpoints to fetch.");
        return;
    }
    // Step 2: Calculate slots for array elements and fetch them
    // Note: For demonstration, we'll fetch the first checkpoint (index 0)
    // You can loop through all indices if needed
    const indexToFetch = Number(arrayLength) - 1; // Change this to fetch different checkpoints

    console.log("indexToFetch", indexToFetch);

    // Calculate the base slot for array data
    // For dynamic arrays, elements are stored at keccak256(slot) + index
    const arrayElementSlot = calculateArrayElementSlot(calculatedMappingSlotForKey, indexToFetch);

    console.log("arrayElementSlot", arrayElementSlot);


    // Now we need to fetch this slot to get the checkpoint data
    const checkpointRes = await client.request({
        method: 'eth_getProof',
        params: [
            contractAddress,
            [arrayElementSlot],
            toHex(BLOCK_NUMBER)
        ]
    });

    const checkpointProof = checkpointRes.storageProof[0];

    // ERC20Votes.Checkpoint typically has two fields:
    // - fromBlock (uint32)
    // - votes (uint224)
    // Both can be packed into a single 32-byte storage slot

    // Let's decode the checkpoint
    const checkpointValue = checkpointProof.value;
    console.log("raw checkpoint value", checkpointValue);

    if (checkpointValue === "0x0") {
        console.log("Checkpoint value not initialized");
    } else {
        // The last 8 hex chars (4 bytes) for fromBlock (uint32)
        const fromBlockHex = `0x${checkpointValue.slice(-8)}` as `0x${string}`;
        // Everything except the last 8 hex chars for votes (uint224)
        const votesHex = `0x${checkpointValue.slice(2, -8)}` as `0x${string}`;

        const fromBlock = hexToBigInt(fromBlockHex);
        const votes = hexToBigInt(votesHex);

        console.log(`Decoded checkpoint: { fromBlock: ${fromBlock}, votes: ${votes} }`);
    }

    // Print proof depths
    console.log("Account proof depth:", checkpointRes.accountProof.length);
    console.log("Account proof depth:", arrayLengthRes.accountProof.length);
    console.log("Storage proof depth checkpoint:", checkpointRes.storageProof[0].proof.length);
    console.log("Storage proof depth array length:", arrayLengthRes.storageProof[0].proof.length);

    const depth = checkpointRes.storageProof[0].proof.length;


    const checkpointProofData = createSerialsFromProof(checkpointRes)[0];

    // Convert array index to padded bytes
    const indexBytes = pad(toHex(indexToFetch), { size: 32 });
    const paddedArrayIndex = serialise(indexBytes);

    // Convert mapping slot to padded bytes
    const mappingSlotBytes = pad(toHex(mappingSlot), { size: 32 });
    const paddedMappingSlot = serialise(mappingSlotBytes);

    // In generateWitness.ts, modify the voting_power_threshold initialization:
    // Structs are packed to the right (first bytes are last item in struct)
    const threshold = 1000_000_000_000_000_000_000n;
    // const threshold = 107272232544679272610965n + 1n;
    const thresholdHex = threshold.toString(16).padStart(56, '0'); // pad to 28 bytes for uint224 (voting power)
    const packedThresholdHex = thresholdHex + "00000000"; // add 4 bytes of zeros at the end for uint32 (block number)
    const votingPowerThreshold = serialise('0x' + packedThresholdHex, true);

    const msgHashBytes = serialise(msgHash);
    const signatureBytes = serialise(signature_64_bytes);
    const publicKeyBytes = serialise(publicKeyFull);

    const proofData = {
        storage_proof: checkpointProofData.storage_proof,
        value: checkpointProofData.value,
        storage_root: checkpointProofData.storage_root,
        padded_mapping_slot: paddedMappingSlot,
        padded_array_index: paddedArrayIndex,
        voting_power_threshold: votingPowerThreshold,
        message_hash: msgHashBytes,
        signature: signatureBytes,
        public_key: publicKeyBytes
    }

    console.log('Proof data:', {
        storage_proof: toHex(checkpointProofData.storage_proof as any),
        value: toHex(checkpointProofData.value as any),
        storage_root: toHex(checkpointProofData.storage_root as any),
        padded_mapping_slot: toHex(paddedMappingSlot as any),
        padded_array_index: toHex(paddedArrayIndex as any),
        public_key: toHex(publicKeyBytes as any),
        message_hash: toHex(msgHashBytes as any),
        signature: toHex(signatureBytes as any),
        voting_power_threshold: toHex(votingPowerThreshold as any),
      })

    const concatenatedBytes = [
        ...checkpointProofData.storage_root,
        ...msgHashBytes,
        ...votingPowerThreshold,
    ];

    const storageProofHex = '0x' + Buffer.from(checkpointProofData.storage_proof).toString('hex');
    console.log("Storage proof hex:", storageProofHex);

    const hexString = '0x' + Buffer.from(concatenatedBytes).toString('hex');
    console.log("Concatenated hex string public inputs:", hexString);

    const hexStringStorageRoot = '0x' + Buffer.from(checkpointProofData.storage_root).toString('hex');
    console.log("Storage root hex string:", hexStringStorageRoot);

    const hexStringMessageHash = '0x' + Buffer.from(msgHashBytes).toString('hex');
    console.log("Message hash hex string:", hexStringMessageHash);

    const hexStringVotingPowerThreshold = '0x' + Buffer.from(votingPowerThreshold).toString('hex');
    console.log("Voting power threshold hex string:", hexStringVotingPowerThreshold);



    // Initialize Noir and the proving backend
    // Dynamically import the correct circuit file
    const circuitData = fs.readFileSync(
        path.resolve(
            __dirname,           // 1. start at current package root (this file's directory)
            '..',                // 2. go back one directory
            'circuits',          // 3. go to circuits directory
            'target',            // 4. go to target directory (assuming you meant "target" not "targets")
            `dao_leaks_depth_${depth}.json` // 5. file name with dynamic depth
        ),
        'utf-8'
    );
    const circuit = JSON.parse(circuitData) as unknown as CompiledCircuit;

    const noir = new Noir(circuit);
    const backend = new UltraHonkBackend(circuit.bytecode);


    try {
        console.log("Generating witness...");
        const { witness } = await noir.execute(proofData);
        console.log("Generated witness ✅");

        console.log("Generating proof...");
        const proof = await backend.generateProof(witness, { keccak: true });
        console.log("Generated proof ✅");

        console.log("Proof:", toHex(proof.proof));
        console.log("Proof length:", proof.proof.length);
        console.log("Proof public inputs:", proof.publicInputs);
        console.log("Proof public inputs length:", proof.publicInputs.length);

        console.log("Verifying proof...");
        const isValid = await backend.verifyProof(proof, { keccak: true });
        console.log(`Proof is ${isValid ? "valid ✅" : "invalid ❌"}`);

        return { proof, isValid };
    } catch (error) {
        console.error("Error during proving:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });