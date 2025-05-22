// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21;

import "forge-std/Script.sol";

import {HonkVerifier as HonkVerifierDepth1} from "../src/verifiers/DaoLeaksDepth1.sol";
import {HonkVerifier as HonkVerifierDepth2} from "../src/verifiers/DaoLeaksDepth2.sol";
import {HonkVerifier as HonkVerifierDepth3} from "../src/verifiers/DaoLeaksDepth3.sol";
import {HonkVerifier as HonkVerifierDepth4} from "../src/verifiers/DaoLeaksDepth4.sol";
import {HonkVerifier as HonkVerifierDepth5} from "../src/verifiers/DaoLeaksDepth5.sol";
import {HonkVerifier as HonkVerifierDepth6} from "../src/verifiers/DaoLeaksDepth6.sol";
import {HonkVerifier as HonkVerifierDepth7} from "../src/verifiers/DaoLeaksDepth7.sol";
import {HonkVerifier as HonkVerifierDepth8} from "../src/verifiers/DaoLeaksDepth8.sol";
import {HonkVerifier as HonkVerifierDepth9} from "../src/verifiers/DaoLeaksDepth9.sol";
import {HonkVerifier as HonkVerifierDepth10} from "../src/verifiers/DaoLeaksDepth10.sol";
import {HonkVerifier as HonkVerifierDepth11} from "../src/verifiers/DaoLeaksDepth11.sol";
import {HonkVerifier as HonkVerifierDepth12} from "../src/verifiers/DaoLeaksDepth12.sol";
import {HonkVerifier as HonkVerifierDepth13} from "../src/verifiers/DaoLeaksDepth13.sol";
import {HonkVerifier as HonkVerifierDepth14} from "../src/verifiers/DaoLeaksDepth14.sol";
import {HonkVerifier as HonkVerifierDepth15} from "../src/verifiers/DaoLeaksDepth15.sol";
import {HonkVerifier as HonkVerifierDepth16} from "../src/verifiers/DaoLeaksDepth16.sol";
import {HonkVerifier as HonkVerifierDepth17} from "../src/verifiers/DaoLeaksDepth17.sol";
import {HonkVerifier as HonkVerifierDepth18} from "../src/verifiers/DaoLeaksDepth18.sol";
import {HonkVerifier as HonkVerifierDepth19} from "../src/verifiers/DaoLeaksDepth19.sol";
import {HonkVerifier as HonkVerifierDepth20} from "../src/verifiers/DaoLeaksDepth20.sol";

import {DaoLeaks} from "../src/DaoLeaks.sol";

contract DeployToBaseSepolia is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // Get storage root from command line arguments
        vm.startBroadcast(deployerPrivateKey);
        
        // Create array of verifier addresses
        address[] memory verifiers = new address[](20);
        verifiers[0] = address(new HonkVerifierDepth1());
        verifiers[1] = address(new HonkVerifierDepth2());
        verifiers[2] = address(new HonkVerifierDepth3());
        verifiers[3] = address(new HonkVerifierDepth4());
        verifiers[4] = address(new HonkVerifierDepth5());
        verifiers[5] = address(new HonkVerifierDepth6());
        verifiers[6] = address(new HonkVerifierDepth7());
        verifiers[7] = address(new HonkVerifierDepth8());
        verifiers[8] = address(new HonkVerifierDepth9());
        verifiers[9] = address(new HonkVerifierDepth10());
        verifiers[10] = address(new HonkVerifierDepth11());
        verifiers[11] = address(new HonkVerifierDepth12());
        verifiers[12] = address(new HonkVerifierDepth13());
        verifiers[13] = address(new HonkVerifierDepth14());
        verifiers[14] = address(new HonkVerifierDepth15());
        verifiers[15] = address(new HonkVerifierDepth16());
        verifiers[16] = address(new HonkVerifierDepth17());
        verifiers[17] = address(new HonkVerifierDepth18());
        verifiers[18] = address(new HonkVerifierDepth19());
        verifiers[19] = address(new HonkVerifierDepth20());

        // Deploy DaoLeaks contract with verifiers and storage root
        DaoLeaks daoLeaks = new DaoLeaks(verifiers, 0xf883ffc73173eb8bfa44647f8c397bc7829447a62a577fd6d90dda0b9c38666b, 1, block.timestamp);
        
        console.log("DaoLeaks deployed to Base Sepolia at:", address(daoLeaks));

        vm.stopBroadcast();
    }
}