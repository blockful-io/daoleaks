
import { createAppKit } from '@reown/appkit/react'

import { WagmiProvider } from 'wagmi'
import { base, baseSepolia, mainnet, defineChain } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { CaipNetworkId } from '@reown/appkit'

// 0. Setup queryClient
const queryClient = new QueryClient()

// 1. Get projectId from https://cloud.reown.com
const projectId = '37cbaafff91120f7e1424b6832caa462'

// 2. Create a metadata object - optional
// const metadata = {
//   name: 'daoleaks',
//   description: 'AppKit Example',
//   url: 'https://reown.com/appkit', // origin must match your domain & subdomain
//   icons: ['https://assets.reown.com/reown-profile-pic.png']
// }

// 3. Set the networks
const anvil = defineChain({
  id: 31337, // Anvil's default chain ID
  caipNetworkId: 'eip155:31337',
  chainNamespace: 'eip155',
  name: 'Anvil Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'], // Default Anvil port
    },
  },
}) 

const networks = [mainnet, base, baseSepolia, anvil]



type CustomRpcUrlMap = Record<CaipNetworkId, {url: string}[]>

const customRpcUrls: CustomRpcUrlMap = {
  'eip155:1': [{ url: 'https://eth-mainnet.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5' }],
  'eip155:8453': [{ url: 'https://base-mainnet.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5' }],
  'eip155:84532': [{ url: 'https://base-sepolia.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5' }],
  'eip155:31337': [{ url: 'http://127.0.0.1:8545' }]
}

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  customRpcUrls,
});

console.log('wagmiAdapter', wagmiAdapter.wagmiConfig);




// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, base, baseSepolia, anvil],
  projectId,
  features: {
    analytics: false, // Optional - defaults to your Cloud configuration
    email: false, // Disable email login
    socials: false, // Disable social logins (Google, Apple, etc.)
    onramp: false, // Disable "Buy crypto" feature
    swaps: false, // Disable "Swap" feature
    send: false, // Disable "Send" feature
    history: false // Disable "Activity" feature
  },
  customRpcUrls,
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
