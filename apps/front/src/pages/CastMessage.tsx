import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { useEnsName } from 'wagmi'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { VotingPowerBadge, getRandomVotingPowerTier } from '@/components/VotingPowerBadge'
import { useSignMessage } from '@/lib/proof/use-sign-message'

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

  // Setup message signing with domain parameters for DAO Leaks
  const { 
    signMessage, 
    signature, 
    isLoading: isSigning, 
    error: signError 
  } = useSignMessage({
    name: 'DAO Leaks',
    version: '1',
    chainId: 1, // Ethereum mainnet
    verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}` // Placeholder contract address
  })

  // Log signature when it becomes available
  useEffect(() => {
    if (signature) {
      console.log('Message signature:', signature)
    }
  }, [signature])

  // Navigate back after successful signing
  useEffect(() => {
    if (signature) {
      console.log('Message successfully signed! Navigating back...')
      // Small delay to ensure user sees the signing success
      setTimeout(() => {
        navigate('/')
      }, 1500)
    }
  }, [signature, navigate])

  // Log signing errors
  useEffect(() => {
    if (signError) {
      console.error('Signing error:', signError)
    }
  }, [signError])

  // Mock function to determine ENS voting power - in real app this would check actual ENS holdings
  const userTier = getRandomVotingPowerTier()

  const handleCastMessage = () => {
    if (!message.trim()) return
    
    // Sign the message using EIP-712 typed data
    console.log('Signing message:', message)
    signMessage(message)
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

          {/* ENS Requirement Warning */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-500 mb-2">ENS Requirement</h3>
                  <p className="text-amber-200 text-sm leading-relaxed">
                    Your wallet must hold at least 1,000 ENS tokens to cast anonymous messages. 
                    This requirement helps maintain message quality and prevents spam.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Information */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-3">Anonymous Tier System</h3>
              <p className="text-gray-400 text-sm mb-4">
                Your message will be categorized anonymously based on your ENS voting power:
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <VotingPowerBadge tier=">50k" />
                </div>
                <div className="flex items-center">
                  <VotingPowerBadge tier=">10k" />
                </div>
                <div className="flex items-center">
                  <VotingPowerBadge tier=">1k" />
                </div>
              </div>
              
              {isConnected && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Your message will appear as:</p>
                  <VotingPowerBadge tier={userTier} />
                </div>
              )}
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

          {/* Cast Button */}
          <Button
            onClick={handleCastMessage}
            disabled={!message.trim() || !isConnected || isSigning}
            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700 disabled:text-gray-400"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {!isConnected 
              ? 'Connect Wallet to Cast' 
              : isSigning 
                ? 'Signing Message...' 
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