import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, MessageCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { useEnsName } from 'wagmi'
import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, http, toHex } from 'viem'
import { mainnet } from 'viem/chains'
import Header from '@/components/Header'
import { VotingPowerBadge } from '@/components/VotingPowerBadge'
import { useSignMessage } from '@/lib/proof/use-sign-message'
import { useENSVotingPower } from '@/lib/use-ens-voting-power'
import { getStorageProofForAccount, serialise } from '@/lib/proof/storage-proof'
import { createBackend, generateWitness, generateProof, verifyProof } from '@/lib/proof/generate-proof'
import { convertSignatureToNoirInputs } from '@/lib/proof/signature-utils'

export default function CastMessage() {
  const navigate = useNavigate()
  const { isConnected, address } = useAppKitAccount()
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 1,
    query: {
      enabled: !!address,
    }
  })
  
  // Suppress unused variable warning - ensName will be used for actual ENS verification
  void ensName
  
  const [message, setMessage] = useState('')
  const [isGeneratingStorageProof, setIsGeneratingStorageProof] = useState(false)
  const [isGeneratingZKProof, setIsGeneratingZKProof] = useState(false)
  const [proofError, setProofError] = useState<string | null>(null)
  const [proofSuccess, setProofSuccess] = useState(false)

  // Environment variables for storage proof
  const contractAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS as `0x${string}`
  const mappingSlot = parseInt(import.meta.env.VITE_MAPPING_SLOT || '0')
  const blockNumber = toHex(parseInt(import.meta.env.VITE_BLOCK_NUMBER))
  const rpcUrl = import.meta.env.VITE_RPC_URL

  // Create public client for storage proof
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl)
  })

  // Get ENS voting power for the connected wallet
  const { 
    votingPower, 
    tier: userTier, 
    isLoading: isLoadingVotingPower, 
    error: votingPowerError, 
    isEligible 
  } = useENSVotingPower(address as `0x${string}`)

  // Setup message signing with domain parameters for DAO Leaks
  const { 
    signMessage, 
    signature, 
    isLoading: isSigning, 
    error: signError,
    getMessageHash
  } = useSignMessage({
    name: 'DAO Leaks',
    version: '1',
    chainId: import.meta.env.VITE_CHAIN_ID as number,
    verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}` // Placeholder contract address
  })

  // Log signature when it becomes available
  useEffect(() => {
    if (signature) {
      console.log('Message signature:', signature)
    }
  }, [signature])

  // Generate storage proof for the account
  const generateStorageProof = useCallback(async () => {
    if (!address) {
      setProofError('No address available')
      return null
    }

    console.log('Generating storage proof...')
    setIsGeneratingStorageProof(true)
    setProofError(null)
    
    try {
      const result = await getStorageProofForAccount(
        publicClient,
        address as `0x${string}`,
        contractAddress,
        mappingSlot,
        blockNumber
      )
      
      if (result.isOk()) {
        console.log('Storage proof generated:', result.value)
        setIsGeneratingStorageProof(false)
        return result.value
      } else {
        console.error('Storage proof generation failed:', result.error)
        setProofError(result.error.message)
        setIsGeneratingStorageProof(false)
        return null
      }
    } catch (error) {
      console.error('Storage proof generation error:', error)
      setProofError(error instanceof Error ? error.message : 'Failed to generate storage proof')
      setIsGeneratingStorageProof(false)
      return null
    }
  }, [address, publicClient, contractAddress, mappingSlot, blockNumber])

  // Log signing errors
  useEffect(() => {
    if (signError) {
      console.error('Signing error:', signError)
    }
  }, [signError])

  // Log voting power errors
  useEffect(() => {
    if (votingPowerError) {
      console.error('Voting power error:', votingPowerError)
    }
  }, [votingPowerError])

  // Generate zero-knowledge proof after both signature and storage proof are ready
  const generateZKProof = useCallback(async (
    storageProofData: any,
    messageSignature: string,
    messageHash: `0x${string}`
  ) => {
    console.log('Starting zero-knowledge proof generation...')
    setIsGeneratingZKProof(true)
    setProofError(null)
    
    try {
      // Convert signature to noir inputs format
      const signatureData = await convertSignatureToNoirInputs(messageSignature, messageHash)
      
      // Setup voting power threshold (using minimum threshold for >1k tier)
      const threshold = 1000n * (10n ** 18n); // 1000 tokens with 18 decimals
      const thresholdHex = threshold.toString(16).padStart(56, '0'); // pad to 28 bytes for uint224
      const packedThresholdHex = thresholdHex + "00000000"; // add 4 bytes of zeros for uint32
      const votingPowerThreshold = serialise('0x' + packedThresholdHex, true);
      
      // Prepare proof data for the circuit
      const proofData = {
        storage_proof: storageProofData.storage_proof.storage_proof,
        value: storageProofData.storage_proof.value,
        storage_root: storageProofData.storage_proof.storage_root,
        padded_mapping_slot: storageProofData.storage_proof.padded_mapping_slot,
        padded_array_index: storageProofData.storage_proof.padded_array_index,
        public_key: signatureData.public_key,
        message_hash: signatureData.message_hash,
        signature: signatureData.signature,
        voting_power_threshold: votingPowerThreshold,
      }
      
      console.log('Creating backend for depth:', storageProofData.depth)
      const { noir, backend } = await createBackend(storageProofData.depth)
      
      console.log('Generating witness...')
      const witnessResult = await generateWitness(noir, proofData)
      
      if (witnessResult.isErr()) {
        throw new Error(`Failed to generate witness: ${witnessResult.error}`)
      }
      
      console.log('Generating proof...')
      const proofResult = await generateProof(backend, witnessResult.value)
      
      if (proofResult.isErr()) {
        throw new Error(`Failed to generate proof: ${proofResult.error}`)
      }
      
      console.log('Verifying proof...')
      const verificationResult = await verifyProof(backend, proofResult.value)
      
      if (verificationResult.isErr()) {
        throw new Error(`Failed to verify proof: ${verificationResult.error}`)
      }
      
      if (!verificationResult.value) {
        throw new Error('Proof verification failed')
      }
      
      console.log('✅ Zero-knowledge proof generated and verified successfully!')
      setIsGeneratingZKProof(false)
      setProofSuccess(true)
      
      // Navigate back after successful completion
      setTimeout(() => {
        navigate('/')
      }, 2000)
      
      return proofResult.value
      
    } catch (error) {
      console.error('Zero-knowledge proof generation error:', error)
      setProofError(error instanceof Error ? error.message : 'Failed to generate zero-knowledge proof')
      setIsGeneratingZKProof(false)
      return null
    }
  }, [navigate])

  const handleCastMessage = async () => {
    if (!message.trim()) return
    
    try {
      setProofError(null)
      setProofSuccess(false)
      
      // Step 1: Sign the message using EIP-712 typed data
      console.log('Signing message:', message)
      const messageSignature = await signMessage(message)
      console.log('Signature received!')
      
      // Step 2: Generate storage proof
      console.log('Generating storage proof...')
      const storageProofResult = await generateStorageProof()
      
      if (!storageProofResult) {
        return // Error already handled in generateStorageProof
      }
      
      // Step 3: Get message hash for the signed message
      const messageHash = getMessageHash(message)
      
      // Step 4: Generate zero-knowledge proof
      await generateZKProof(storageProofResult, messageSignature, messageHash)
      
    } catch (error) {
      console.error('Error in proof flow:', error)
      setProofError(error instanceof Error ? error.message : 'Failed to complete proof generation')
      // Reset loading states on error
      setIsGeneratingStorageProof(false)
      setIsGeneratingZKProof(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Page Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Cast Anonymous Message</h2>
            <p className="text-gray-400">Share your thoughts while maintaining privacy</p>
          </div>

          {/* ENS Voting Power Status */}
          <Card className={`${
            !isConnected 
              ? 'bg-gray-500/10 border-gray-500/20'
              : isLoadingVotingPower 
                ? 'bg-blue-500/10 border-blue-500/20'
                : isEligible 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {!isConnected ? (
                  <XCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                ) : isLoadingVotingPower ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5 flex-shrink-0" />
                ) : isEligible ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${
                    !isConnected 
                      ? 'text-gray-500' 
                      : isLoadingVotingPower 
                        ? 'text-blue-400'
                        : isEligible 
                          ? 'text-green-500' 
                          : 'text-red-500'
                  }`}>
                    {!isConnected 
                      ? 'Wallet Not Connected'
                      : isLoadingVotingPower 
                        ? 'Checking ENS Voting Power...' 
                        : isEligible 
                          ? 'ENS Requirements Met' 
                          : 'ENS Requirements Not Met'
                    }
                  </h3>
                  
                  {!isConnected ? (
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Connect your wallet to check your ENS voting power and eligibility for anonymous messaging.
                    </p>
                  ) : isLoadingVotingPower ? (
                    <p className="text-blue-200 text-sm leading-relaxed">
                      Loading your ENS voting power from the blockchain...
                    </p>
                  ) : votingPower !== undefined ? (
                    <div className="space-y-2">
                      <p className={`text-sm leading-relaxed ${
                        isEligible ? 'text-green-200' : 'text-red-200'
                      }`}>
                        Your wallet has <span className="font-mono font-semibold">{Math.round(votingPower).toLocaleString()}</span> ENS voting power. {
                          isEligible 
                            ? 'You can cast anonymous messages!' 
                            : 'You need at least 1,000 ENS voting power to cast messages.'
                        }
                      </p>
                      {userTier && (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isEligible ? 'text-green-200' : 'text-red-200'}`}>
                            Voting Tier:
                          </span>
                          <VotingPowerBadge tier={userTier} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-amber-200 text-sm leading-relaxed">
                      Unable to load ENS voting power. Please try refreshing or check your network connection.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Information */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-3">Anonymous Tier System</h3>
              <p className="text-gray-400 text-sm mb-4">
                Messages are categorized anonymously based on ENS voting power:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <VotingPowerBadge tier=">50k" />
                  <span className="text-xs text-gray-500">50,000+ voting power</span>
                </div>
                <div className="flex items-center justify-between">
                  <VotingPowerBadge tier=">10k" />
                  <span className="text-xs text-gray-500">10,000+ voting power</span>
                </div>
                <div className="flex items-center justify-between">
                  <VotingPowerBadge tier=">1k" />
                  <span className="text-xs text-gray-500">1,000+ voting power</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Composer */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-3">Your Message</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your anonymous thoughts about DAO governance, proposals, or insights..."
                className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {message.length}/500 characters
                </span>
                <span className="text-xs text-gray-500">
                  Zero-knowledge proof will be generated
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Proof Generation Status */}
          {proofError && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-500 mb-2">Proof Generation Error</h3>
                    <p className="text-red-200 text-sm leading-relaxed">
                      {proofError}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {proofSuccess && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-500 mb-2">Message Cast Successfully!</h3>
                    <p className="text-green-200 text-sm leading-relaxed">
                      Your anonymous message has been verified with zero-knowledge proof and cast to the DAO. Redirecting you back to the main page...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(isSigning || isGeneratingStorageProof || isGeneratingZKProof) && !proofError && !proofSuccess && (
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-500 mb-2">
                      {isGeneratingZKProof 
                        ? 'Generating Zero-Knowledge Proof...' 
                        : isGeneratingStorageProof
                          ? 'Generating Storage Proof...'
                          : 'Signing Message...'
                      }
                    </h3>
                    <p className="text-blue-200 text-sm leading-relaxed">
                      {isGeneratingZKProof 
                        ? 'Creating cryptographic proof to verify your ENS voting power while keeping your identity anonymous. This may take a few moments...'
                        : isGeneratingStorageProof
                          ? 'Fetching blockchain storage proof to verify your ENS voting power...'
                          : 'Please sign the message in your wallet to authenticate and proceed with proof generation...'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cast Button */}
          <Button
            onClick={handleCastMessage}
            disabled={!message.trim() || !isConnected || !isEligible || isLoadingVotingPower || isGeneratingStorageProof || isGeneratingZKProof || isSigning}
            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700 disabled:text-gray-400"
            size="lg"
          >
            {isGeneratingZKProof ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : isGeneratingStorageProof ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : isSigning ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="w-5 h-5 mr-2" />
            )}
            {!isConnected 
              ? 'Connect Wallet to Cast' 
              : isLoadingVotingPower
                ? 'Checking Eligibility...'
              : !isEligible
                ? 'Insufficient ENS Voting Power'
              : isGeneratingZKProof
                ? 'Generating Zero-Knowledge Proof...'
              : isGeneratingStorageProof
                ? 'Generating Storage Proof...'
              : isSigning 
                ? 'Signing Message...' 
                : proofSuccess
                  ? 'Message Cast Successfully!'
                  : 'Cast Anonymous Message'
            }
          </Button>

          {/* Privacy Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your identity remains anonymous. Only your ENS voting power tier is revealed.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 