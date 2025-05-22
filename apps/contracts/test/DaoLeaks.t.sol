// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21;

import "./TestSetup.sol";
import {console} from "forge-std/console.sol";

contract DaoLeaksTest is TestSetup {
    // Test events
    event MessagePosted(string message, bytes votingPowerLevel, uint256 timestamp);

    function setUp() public override {
        super.setUp();
    }

    function testPostMessage() public {
        bytes memory proof = getProof();
        string memory message = "Signed by Alice";
        uint8 votingPowerLevel = 0;
        uint256 storageProofDepth = getStorageProofDepth();

        // // Expect the MessagePosted event to be emitted
        // vm.expectEmit(true, true, true, true);
        // emit MessagePosted(message, votingPowerLevel, block.timestamp);

        // Post the message
        daoLeaks.postMessage(proof, message, votingPowerLevel, storageProofDepth, getExpectedStorageRoot());

        // Get all messages and verify the first one
        DaoLeaks.Message[] memory messages = daoLeaks.getMessages(0, 1);
        assertEq(messages[0].message, message, "Message content mismatch");
        assertEq(keccak256(abi.encodePacked(messages[0].votingPowerLevel)), keccak256(abi.encodePacked(daoLeaks.getVotingPowerLevel(votingPowerLevel))), "Voting power level mismatch");
        assertGt(messages[0].timestamp, 0, "Timestamp should be set");
    }
    
    function testComparePublicInputs() public view {
        // Get expected values
        bytes32 expectedRoot = getExpectedStorageRoot();
        bytes32 expectedHash = getExpectedMessageHash();
        bytes32 expectedPower = getExpectedVotingPowerLevel();

        // Generate inputs using our function
        string memory message = "Signed by Alice";
        uint224 votingPower = daoLeaks.getVotingPowerLevel(0);
        (bytes32 storageRoot, , ) = daoLeaks.getLastStorageRoot();
        
        // Log expected values for debugging
        console.log("Expected Storage Root:");
        console.logBytes32(expectedRoot);
        console.log("Storage Root from DaoLeaks contract:");
        console.logBytes32(storageRoot);

        console.log("--------------------------------");

        console.log("Expected Message Hash:");
        console.logBytes32(expectedHash);
        console.log("Message Hash from DaoLeaks contract:");
        console.logBytes32(daoLeaks.hashMessage(message));
        console.log("Message used for generation:");
        console.log(message);

        console.log("--------------------------------");

        console.log("Expected Voting Power:");
        console.logBytes32(expectedPower);
        
        bytes32[] memory generatedInputs = daoLeaks.generatePublicInputs(message, votingPower, storageRoot);
        
        // Reconstruct the 3 original values from the 96 generated inputs
        bytes memory genRootBytes = new bytes(32);
        bytes memory genHashBytes = new bytes(32);
        bytes memory genPowerBytes = new bytes(32);
        
        for (uint i = 0; i < 32; i++) {
            genRootBytes[i] = bytes1(uint8(uint256(generatedInputs[i])));
            genHashBytes[i] = bytes1(uint8(uint256(generatedInputs[32 + i])));
            genPowerBytes[i] = bytes1(uint8(uint256(generatedInputs[64 + i])));
        }
        
        bytes32 generatedRoot = bytes32(genRootBytes);
        bytes32 generatedHash = bytes32(genHashBytes);
        bytes32 generatedPower = bytes32(genPowerBytes);
        
        // Log generated values for comparison
        console.log("Generated Storage Root:");
        console.logBytes32(generatedRoot);
        
        console.log("Generated Message Hash:");
        console.logBytes32(generatedHash);
        
        console.log("Generated Voting Power:");
        console.logBytes32(generatedPower);
        
        // We don't expect these to match yet, but we can see the differences
        assertEq(generatedRoot, expectedRoot, "Storage root should match");
        assertEq(generatedHash, expectedHash, "Message hash should match");
        assertEq(generatedPower, expectedPower, "Voting power should match");
    }
} 