// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import {HonkVerifier} from "./verifiers/DaoLeaksDepth1.sol";


contract DaoLeaks {
    // State variables
    struct Message {
        string message;
        uint224 votingPowerLevel;
        uint256 timestamp;
    }

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant MESSAGE_TYPEHASH = keccak256("Message(string message)");
    bytes32 private DOMAIN_SEPARATOR;

    Message[] public messages;

    HonkVerifier[] public verifiers;

    mapping(uint8 => uint224) public votingPowerLevels;

    struct StorageRoot {
        bytes32 storageRoot;
        uint256 blockNumber;
        uint256 timestamp;
    }

    mapping(bytes32 => StorageRoot) public storageRoots;

    bytes32 public lastStorageRoot;
    uint256 public storageRootMaxAge = 86400;

    // Constructor
    constructor(address[] memory _verifiers, bytes32 _storageRoot, uint256 _blockNumber, uint256 _timestamp) {
        for (uint256 i = 0; i < _verifiers.length; i++) {
            verifiers.push(HonkVerifier(_verifiers[i]));
        }

        lastStorageRoot = _storageRoot;
        storageRoots[_storageRoot] =
            StorageRoot({storageRoot: _storageRoot, blockNumber: _blockNumber, timestamp: _timestamp});
        votingPowerLevels[0] = 1_000 * 10 ** 18;
        votingPowerLevels[1] = 10_000 * 10 ** 18;
        votingPowerLevels[2] = 50_000 * 10 ** 18;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("DaoLeaks")), // name
                keccak256(bytes("1")), // version
                block.chainid,
                address(this)
            )
        );
    }

    // Events

    // When someone posts a message: message, voting power, timestamp
    event MessagePosted(string message, uint224 votingPowerLevel, uint256 timestamp);

    // Functions

    // Helper function to generate public inputs
    function generatePublicInputs(string memory message, uint224 votingPowerLevel, bytes32 storageRoot)
        public
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory publicInputs = new bytes32[](96);

        // Get the message hash
        bytes32 messageHash = hashMessage(message);

        // Convert votingPowerLevel to bytes32
        bytes32 powerBytes = bytes32(abi.encodePacked(votingPowerLevel, uint32(0)));

        // Combine all 3 inputs (each 32 bytes) and split them into 96 inputs (each representing 1 byte)
        bytes memory combined = abi.encodePacked(storageRoot, messageHash, powerBytes);

        // Fill the first 96 inputs (1 byte per input)
        for (uint256 i = 0; i < 96; i++) {
            if (i < combined.length) {
                // Take 1 byte and pad it to a full bytes32
                publicInputs[i] = bytes32(uint256(uint8(combined[i])));
            } else {
                // Pad with zeros if we've run out of data (unlikely but safe)
                publicInputs[i] = bytes32(0);
            }
        }

        return publicInputs;
    }

    // When someone posts a message: proof, message, voting power level
    function postMessage(
        bytes calldata proof,
        string memory message,
        uint8 votingPowerLevel,
        uint256 storageProofDepth,
        bytes32 storageRoot
    ) public {
        // Check if the storage root is too old
        // This also checks if the storage root exists for free
        StorageRoot memory rootData = storageRoots[storageRoot];
        if (rootData.timestamp + storageRootMaxAge < block.timestamp) {
            revert("Storage root is too old");
        }

        // Generate public inputs from message and voting power
        bytes32[] memory publicInputs = generatePublicInputs(message, votingPowerLevels[votingPowerLevel], storageRoot);

        // Verify the proof
        verifiers[storageProofDepth - 1].verify(proof, publicInputs);

        // Add the message to the array
        messages.push(
            Message({
                message: message,
                votingPowerLevel: votingPowerLevels[votingPowerLevel],
                timestamp: block.timestamp
            })
        );

        // Post the message
        emit MessagePosted(message, votingPowerLevels[votingPowerLevel], block.timestamp);
    }

    // Get all messages paginated
    function getMessages(uint256 page, uint256 pageSize) public view returns (Message[] memory) {
        // Get the start and end index
        uint256 startIndex = page * pageSize;
        uint256 endIndex = startIndex + pageSize;

        // Make sure endIndex doesn't exceed array length
        if (endIndex > messages.length) {
            endIndex = messages.length;
        }

        // Calculate actual size of the return array
        uint256 resultSize = endIndex - startIndex;

        // Create a new array in memory with the correct size
        Message[] memory result = new Message[](resultSize);

        // Copy elements to the new array
        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = messages[startIndex + i];
        }

        return result;
    }

    // Get the total number of messages
    function getTotalMessages() public view returns (uint256) {
        return messages.length;
    }

    // Get the total number of pages
    function getTotalPages(uint256 pageSize) public view returns (uint256) {
        return messages.length / pageSize;
    }

    // Hash message using EIP-712 structured data format
    function hashMessage(string memory message) public view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(MESSAGE_TYPEHASH, keccak256(bytes(message))));

        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function getVotingPowerLevel(uint8 level) public view returns (uint224) {
        return votingPowerLevels[level];
    }

    // add new storage root
    // TODO: PUBLIC FOR HACKATHON, MUST BE PROPER ORACLE FOR PROD
    function addStorageRoot(bytes32 storageRoot, uint256 blockNumber, uint256 timestamp) public {
        storageRoots[storageRoot] =
            StorageRoot({storageRoot: storageRoot, blockNumber: blockNumber, timestamp: timestamp});
        lastStorageRoot = storageRoot;
    }

    // get storage root by index
    function getStorageRoot(bytes32 storageRoot) public view returns (bytes32, uint256, uint256) {
        StorageRoot memory rootData = storageRoots[storageRoot];
        return (rootData.storageRoot, rootData.blockNumber, rootData.timestamp);
    }

    // get total number of storage roots
    function getLastStorageRoot() public view returns (bytes32, uint256, uint256) {
        StorageRoot memory rootData = storageRoots[lastStorageRoot];
        return (rootData.storageRoot, rootData.blockNumber, rootData.timestamp);
    }
}
