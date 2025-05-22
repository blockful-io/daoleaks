// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

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

contract TestSetup is Test {
    HonkVerifierDepth1 public verifier1;
    HonkVerifierDepth2 public verifier2;
    HonkVerifierDepth3 public verifier3;
    HonkVerifierDepth4 public verifier4;
    HonkVerifierDepth5 public verifier5;
    HonkVerifierDepth6 public verifier6;
    HonkVerifierDepth7 public verifier7;
    HonkVerifierDepth8 public verifier8;
    HonkVerifierDepth9 public verifier9;
    HonkVerifierDepth10 public verifier10;
    HonkVerifierDepth11 public verifier11;
    HonkVerifierDepth12 public verifier12;
    HonkVerifierDepth13 public verifier13;
    HonkVerifierDepth14 public verifier14;
    HonkVerifierDepth15 public verifier15;
    HonkVerifierDepth16 public verifier16;
    HonkVerifierDepth17 public verifier17;
    HonkVerifierDepth18 public verifier18;
    HonkVerifierDepth19 public verifier19;
    HonkVerifierDepth20 public verifier20;
    DaoLeaks public daoLeaks;

    function setUp() public virtual {
        // Deploy a new instance of HonkVerifier for testing
        verifier1 = new HonkVerifierDepth1();
        verifier2 = new HonkVerifierDepth2();
        verifier3 = new HonkVerifierDepth3();
        verifier4 = new HonkVerifierDepth4();
        verifier5 = new HonkVerifierDepth5();
        verifier6 = new HonkVerifierDepth6();
        verifier7 = new HonkVerifierDepth7();
        verifier8 = new HonkVerifierDepth8();
        verifier9 = new HonkVerifierDepth9();
        verifier10 = new HonkVerifierDepth10();
        verifier11 = new HonkVerifierDepth11();
        verifier12 = new HonkVerifierDepth12();
        verifier13 = new HonkVerifierDepth13();
        verifier14 = new HonkVerifierDepth14();
        verifier15 = new HonkVerifierDepth15();
        verifier16 = new HonkVerifierDepth16();
        verifier17 = new HonkVerifierDepth17();
        verifier18 = new HonkVerifierDepth18();
        verifier19 = new HonkVerifierDepth19();
        verifier20 = new HonkVerifierDepth20();

        address[] memory verifiers = new address[](20);
        verifiers[0] = address(verifier1);
        verifiers[1] = address(verifier2);
        verifiers[2] = address(verifier3);
        verifiers[3] = address(verifier4);
        verifiers[4] = address(verifier5);

        // Deploy DaoLeaks with the verifiers
        address targetAddress = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266); // Your desired address

        bytes memory args = abi.encode(verifiers, getExpectedStorageRoot(), 1, block.timestamp);
    
        deployCodeTo("DaoLeaks.sol", args, targetAddress);
        daoLeaks = DaoLeaks(targetAddress);
    }

    function getPublicInputs() internal view returns (bytes32[] memory) {
        bytes memory rawInput = vm.envBytes("HONK_PUBLIC_INPUTS");
        bytes32[] memory publicInputs = new bytes32[](96);

        for (uint256 i = 0; i < publicInputs.length; i++) {
            publicInputs[i] = bytes32(uint256(uint8(rawInput[i])));
        }
        return publicInputs;
    }

    function getProof() internal view returns (bytes memory) {
        // Get proof from environment variable
        bytes memory proof = vm.envBytes("HONK_PROOF");
        require(proof.length == 440 * 32, "Invalid proof length from env var");
        return proof;
    }

    function getStorageProofDepth() internal view returns (uint256) {
        uint256 storageProofDepth = vm.envUint("STORAGE_PROOF_DEPTH");
        return storageProofDepth;
    }

    // Function to extract expected storage root from getPublicInputs
    function getExpectedStorageRoot() internal view returns (bytes32) {
        bytes32[] memory publicInputs = getPublicInputs();
        // According to the specification, the storage root should be in the first set of inputs
        // Here we're reconstructing it from individual bytes
        bytes memory rootBytes = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            // Take the first 32 values and extract just the least significant byte from each
            if (i < 32) {
                rootBytes[i] = bytes1(uint8(uint256(publicInputs[i])));
            }
        }
        return bytes32(rootBytes);
    }

    // Function to extract expected message hash from getPublicInputs
    function getExpectedMessageHash() internal view returns (bytes32) {
        bytes32[] memory publicInputs = getPublicInputs();
        // According to the specification, the message hash should be in the second set of inputs
        bytes memory hashBytes = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            // Take the second 32 values (32-63) and extract just the least significant byte from each
            if (32 + i < 64) {
                hashBytes[i] = bytes1(uint8(uint256(publicInputs[32 + i])));
            }
        }
        return bytes32(hashBytes);
    }

    // Function to extract expected voting power level from getPublicInputs
    function getExpectedVotingPowerLevel() internal view returns (bytes32) {
        bytes32[] memory publicInputs = getPublicInputs();
        // According to the specification, the voting power should be in the third set of inputs
        bytes memory powerBytes = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            // Take the third 32 values (64-95) and extract just the least significant byte from each
            if (64 + i < 96) {
                powerBytes[i] = bytes1(uint8(uint256(publicInputs[64 + i])));
            }
        }
        return bytes32(powerBytes);
    }
}
