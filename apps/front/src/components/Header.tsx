import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useEnsName } from 'wagmi'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()
  const { open } = useAppKit()
  const { isConnected, address } = useAppKitAccount()
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 1, // ENS is on Ethereum mainnet
    query: {
      enabled: !!address, // Only query when address exists
    }
  })

  const handleConnect = () => {
    if (isConnected) {
      // Open account view if already connected
      open({ view: 'Account' })
    } else {
      // Open connect view to connect wallet
      open({ view: 'Connect' })
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">DAO_leaks</h1>
          </div>
          <Button 
            onClick={handleConnect}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isConnected ? (
              <>
                {ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Account')}
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </div>
    </header>
  )
} 