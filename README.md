# DaoLeaks

DaoLeaks Base Sepolia contract:
```
0x65cC4D5f790dF736cD54d675d9280c056d640b22
```

Mocked Governance Token for testing:
```
0x1C9039Be216f35291B2bCf67E5aB1F668db58Ac0
```


## Run tests:
1. pnpm run circuits compile
2. pnpm run contracts anvil (keep running)
3. pnpm run contracts prepare-tests
4. pnpm run contracts ts generateWitness -> then copy proof, Concatenated hex string public inputs and Storage proof depth checkpoint: 2 to contract's .env
5. pnpm run contracts forge-test
6. kill anvil process

## Run devnet:
1. pnpm run circuits compile
2. pnpm run contracts setup-devnet

# What we achieved
1. Circuit to verify Ethereum Storage proofs on mainnet or any other blockchain.
2. Smart contract to verify such proofs
3. Frontend for users to interact entirely privately and gasless

We managed to build a PoC for a decentralized private messaging application for DAOs, token holders or any other identifier that is present on chain

# What is pending
1. Circuit had to be reduced in size to accommodate present noir client side proving limitation. Check branch ` circuit-stash-double` for the code for the actual full circuit
2. Smart contract relies on Oracle to fetch valid `storage_roots`. There are 2 ways forward here: restrict access to `addStorageRoot` to trusted oracle protocols or admins OR to create a ZK proof that verifies storage_root of a contract against the block hash from ethereum and then fetch this hash from Base's native oracle
