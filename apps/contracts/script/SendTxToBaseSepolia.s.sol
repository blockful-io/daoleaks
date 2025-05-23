// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21;

import "forge-std/Script.sol";
import {DaoLeaks} from "../src/DaoLeaks.sol";

contract SendTxToBaseSepolia is Script {
    // Replace with your deployed contract address on Base Sepolia
    address constant DAOLEAKS_CONTRACT = 0xeF72FD35C345b2f0541e5E05C69A40Def7713C18; // UPDATE THIS
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Get the deployed contract instance
        DaoLeaks daoLeaks = DaoLeaks(DAOLEAKS_CONTRACT);
        
        // Example parameters for postMessage call
        // NOTE: These are example values - you'll need real proof data for actual use
        bytes memory proof = vm.envBytes("PROOF"); // Replace with actual proof
        string memory message = "Signed by Alice";
        uint8 votingPowerLevel = 1; // 0 = 1,000 tokens, 1 = 10,000 tokens, 2 = 50,000 tokens
        uint256 storageProofDepth = 4; // Depth of the storage proof (1-20)

        uint224 votingPowerLevel2 = daoLeaks.getVotingPowerLevel(1);
        console.log("Voting Power Level:", votingPowerLevel2);
        
        revert();
        // Get the latest storage root from the contract
        bytes32 storageRoot = 0xe55bdc2b57da62eab374873568f782b2231153302e65145ffc7fd936bb820949;
        
        console.log("Sending PostMessage transaction...");
        console.log("Contract Address:", DAOLEAKS_CONTRACT);
        console.log("Message:", message);
        console.log("Voting Power Level:", votingPowerLevel);
        console.log("Storage Proof Depth:", storageProofDepth);
        console.log("Storage Root:", vm.toString(storageRoot));
        
        // Call postMessage function
        try daoLeaks.postMessage(
            proof,
            message,
            votingPowerLevel,
            storageProofDepth,
            storageRoot
        ) {
            console.log("PostMessage transaction successful!");
            
            // Get the total number of messages to verify
            uint256 totalMessages = daoLeaks.getTotalMessages();
            console.log("Total messages after posting:", totalMessages);
            
        } catch Error(string memory reason) {
            console.log("PostMessage transaction failed with reason:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("PostMessage transaction failed with low-level error");
            console.logBytes(lowLevelData);
        }
        
        vm.stopBroadcast();
    }
    
    // Helper function to add a new storage root (for testing)
    function addStorageRoot(bytes32 storageRoot, uint256 blockNumber) public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        DaoLeaks daoLeaks = DaoLeaks(DAOLEAKS_CONTRACT);
        
        console.log("Adding new storage root...");
        console.log("Storage Root:", vm.toString(storageRoot));
        console.log("Block Number:", blockNumber);
        
        daoLeaks.addStorageRoot(storageRoot, blockNumber, block.timestamp);
        
        console.log("Storage root added successfully!");
        
        vm.stopBroadcast();
    }
    
    // Helper function to get contract info
    function getContractInfo() public view {
        DaoLeaks daoLeaks = DaoLeaks(DAOLEAKS_CONTRACT);
        
        console.log("=== Contract Information ===");
        console.log("Contract Address:", DAOLEAKS_CONTRACT);
        
        uint256 totalMessages = daoLeaks.getTotalMessages();
        console.log("Total Messages:", totalMessages);
        
        (bytes32 storageRoot, uint256 blockNumber, uint256 timestamp) = daoLeaks.getLastStorageRoot();
        console.log("Last Storage Root:", vm.toString(storageRoot));
        console.log("Block Number:", blockNumber);
        console.log("Timestamp:", timestamp);
        
        // Get voting power levels
        uint224 level0 = daoLeaks.getVotingPowerLevel(0);
        uint224 level1 = daoLeaks.getVotingPowerLevel(1);
        uint224 level2 = daoLeaks.getVotingPowerLevel(2);
        
        console.log("Voting Power Level 0:", level0);
        console.log("Voting Power Level 1:", level1);
        console.log("Voting Power Level 2:", level2);
    }
}
