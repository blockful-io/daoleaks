import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, MessageCircle, Loader2, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { VotingPowerBadge, type VotingPowerTier } from '@/components/VotingPowerBadge'
import { useState, useEffect, useCallback, useRef } from 'react'

// Mock data for demonstration - 20 messages total
const mockPosts = [
  {
    id: 1,
    votingPower: '>50k' as VotingPowerTier,
    timeAgo: '5 hr. ago',
    content: "🥲 In the ever-evolving landscape of decentralized technology, it's crucial to acknowledge the transformative potential of Web3. This new paradigm empowers users by shifting control from centralized entities to individuals, fostering a more equitable digital ecosystem. As we navigate this transition, the importance of community-driven governance and transparency cannot be overstated.",
  },
  {
    id: 2,
    votingPower: '>1k' as VotingPowerTier,
    timeAgo: '10 hr. ago',
    content: "As we navigate the dynamic world of decentralized technologies, it's important to highlight the role of ENS DAO in shaping the future. This innovative approach not only enhances user autonomy but also promotes a collaborative ecosystem where every voice matters.",
  },
  {
    id: 3,
    votingPower: '>10k' as VotingPowerTier,
    timeAgo: '12 hr. ago',
    content: "In the ever-evolving landscape of decentralized technology, it's crucial to acknowledge the transformative potential of Web3. This new paradigm empowers users by shifting control from centralized entities to individuals, fostering a more equitable digital ecosystem.",
  },
  {
    id: 4,
    votingPower: '>100' as VotingPowerTier,
    timeAgo: '1 day ago',
    content: "The recent developments in DeFi protocols have shown remarkable innovation in yield farming mechanisms. However, we must remain vigilant about security vulnerabilities and ensure proper auditing processes are in place.",
  },
  {
    id: 5,
    votingPower: '>5k' as VotingPowerTier,
    timeAgo: '1 day ago',
    content: "Smart contract deployment on Layer 2 solutions has become increasingly cost-effective. The gas savings alone make it a compelling choice for developers looking to build scalable dApps.",
  },
  {
    id: 6,
    votingPower: '>50k' as VotingPowerTier,
    timeAgo: '2 days ago',
    content: "Cross-chain interoperability remains one of the most challenging aspects of blockchain development. Recent advances in bridge technology show promise, but we're still far from seamless multi-chain experiences.",
  },
  {
    id: 7,
    votingPower: '>1k' as VotingPowerTier,
    timeAgo: '2 days ago',
    content: "The importance of decentralized identity solutions cannot be overstated in today's digital landscape. Users need full control over their digital identity without relying on centralized authorities.",
  },
  {
    id: 8,
    votingPower: '>10k' as VotingPowerTier,
    timeAgo: '3 days ago',
    content: "NFT royalties debate continues to divide the community. While creators deserve fair compensation, the technical implementation and market dynamics present complex challenges that need thoughtful solutions.",
  },
  {
    id: 9,
    votingPower: '>100' as VotingPowerTier,
    timeAgo: '3 days ago',
    content: "Governance token distribution mechanisms significantly impact project decentralization. Fair launch strategies and community incentives should be carefully designed to avoid whale dominance.",
  },
  {
    id: 10,
    votingPower: '>5k' as VotingPowerTier,
    timeAgo: '4 days ago',
    content: "Zero-knowledge proofs are revolutionizing privacy in blockchain applications. ZK-SNARKs and ZK-STARKs enable verification without revealing sensitive information, opening new possibilities for private DeFi.",
  },
  {
    id: 11,
    votingPower: '>50k' as VotingPowerTier,
    timeAgo: '4 days ago',
    content: "The MEV landscape continues to evolve with new extraction methods and protection mechanisms. Builder centralization poses risks that the community must address through innovative protocol designs.",
  },
  {
    id: 12,
    votingPower: '>1k' as VotingPowerTier,
    timeAgo: '5 days ago',
    content: "Liquid staking derivatives are reshaping the validator economy. While they provide flexibility for stakers, the concentration risk and slashing conditions require careful consideration.",
  },
  {
    id: 13,
    votingPower: '>10k' as VotingPowerTier,
    timeAgo: '5 days ago',
    content: "Account abstraction will fundamentally change how users interact with blockchain applications. Gas abstraction and social recovery mechanisms will significantly improve user experience.",
  },
  {
    id: 14,
    votingPower: '>100' as VotingPowerTier,
    timeAgo: '6 days ago',
    content: "The sustainability debate around blockchain energy consumption has led to innovative consensus mechanisms. Proof-of-Stake adoption shows promise, but we need continued focus on environmental impact.",
  },
  {
    id: 15,
    votingPower: '>5k' as VotingPowerTier,
    timeAgo: '6 days ago',
    content: "Decentralized storage solutions are becoming more robust and cost-effective. IPFS, Arweave, and Filecoin each offer unique advantages for different use cases in the decentralized web.",
  },
  {
    id: 16,
    votingPower: '>50k' as VotingPowerTier,
    timeAgo: '1 week ago',
    content: "Regulatory clarity remains a significant challenge for DeFi protocols. The balance between innovation and compliance requires ongoing dialogue between builders and regulatory bodies.",
  },
  {
    id: 17,
    votingPower: '>1k' as VotingPowerTier,
    timeAgo: '1 week ago',
    content: "Multi-signature wallets have become essential for treasury management in DAOs. The security benefits outweigh the operational complexity, especially for high-value transactions.",
  },
  {
    id: 18,
    votingPower: '>10k' as VotingPowerTier,
    timeAgo: '1 week ago',
    content: "Flash loans enable complex arbitrage strategies but also create new attack vectors. The sophistication of MEV bots continues to increase, requiring more robust protocol designs.",
  },
  {
    id: 19,
    votingPower: '>100' as VotingPowerTier,
    timeAgo: '1 week ago',
    content: "Decentralized exchanges are approaching CEX-level liquidity in major trading pairs. AMM innovations and concentrated liquidity models are driving this convergence.",
  },
  {
    id: 20,
    votingPower: '>5k' as VotingPowerTier,
    timeAgo: '2 weeks ago',
    content: "The composability of DeFi protocols creates powerful synergies but also systemic risks. Protocol interdependencies require careful risk assessment and management strategies.",
  }
]

const POSTS_PER_PAGE = 5

type FilterTier = '>1k' | '>10k' | '>50k'

export default function Home() {
  const navigate = useNavigate()
  const [displayedPosts, setDisplayedPosts] = useState(mockPosts.slice(0, POSTS_PER_PAGE))
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedFilters, setSelectedFilters] = useState<FilterTier[]>(['>1k', '>10k', '>50k'])
  const loadingRef = useRef<HTMLDivElement>(null)

  const getFilteredPosts = useCallback(() => {
    if (selectedFilters.length === 0) {
      return mockPosts
    }
    return mockPosts.filter(post => selectedFilters.includes(post.votingPower as FilterTier))
  }, [selectedFilters])

  const toggleFilter = (filter: FilterTier) => {
    setSelectedFilters(prev => {
      const newFilters = prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
      
      // Reset pagination when filters change
      setCurrentPage(1)
      setHasMore(true)
      
      return newFilters
    })
  }

  // Update displayed posts when filters change
  useEffect(() => {
    const filteredPosts = getFilteredPosts()
    setDisplayedPosts(filteredPosts.slice(0, POSTS_PER_PAGE))
    setHasMore(filteredPosts.length > POSTS_PER_PAGE)
  }, [selectedFilters, getFilteredPosts])

  const loadMorePosts = useCallback(() => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    
    // Simulate API delay
    setTimeout(() => {
      const filteredPosts = getFilteredPosts()
      const nextPage = currentPage + 1
      const startIndex = (nextPage - 1) * POSTS_PER_PAGE
      const endIndex = startIndex + POSTS_PER_PAGE
      const newPosts = filteredPosts.slice(startIndex, endIndex)
      
      if (newPosts.length === 0) {
        setHasMore(false)
      } else {
        setDisplayedPosts(prev => [...prev, ...newPosts])
        setCurrentPage(nextPage)
      }
      
      setIsLoading(false)
    }, 800) // Simulate network delay
  }, [currentPage, isLoading, hasMore, getFilteredPosts])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !isLoading) {
          loadMorePosts()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current)
      }
    }
  }, [loadMorePosts, hasMore, isLoading])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />

      {/* Filters */}
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400 font-medium">Filter by voting power:</span>
          </div>
          
          {(['>1k', '>10k', '>50k'] as FilterTier[]).map((filter) => (
            <Button
              key={filter}
              variant={selectedFilters.includes(filter) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(filter)}
              className={selectedFilters.includes(filter)
                ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              }
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

       {/* Main Content */}
       <main className="container mx-auto px-4 py-6 max-w-4xl pb-32">
         <div className="space-y-4">
           {displayedPosts.map((post) => (
             <Card key={post.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
               <CardContent className="p-4">
                 <div className="flex items-center justify-between mb-3">
                   <VotingPowerBadge tier={post.votingPower} />
                   
                   <div className="flex items-center gap-1 text-sm text-gray-500">
                     <Clock className="w-4 h-4" />
                     {post.timeAgo}
                   </div>
                 </div>
                 
                 <p className="text-gray-300 leading-relaxed">
                   {post.content}
                 </p>
               </CardContent>
             </Card>
           ))}
           
           {/* Loading indicator and infinite scroll trigger */}
           <div ref={loadingRef} className="flex justify-center py-8">
             {isLoading && (
               <div className="flex items-center gap-2 text-gray-500">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <span>Loading more messages...</span>
               </div>
             )}
             {!hasMore && displayedPosts.length > 0 && (
               <div className="text-gray-500 text-center">
                 <p>You've reached the end! No more messages to load.</p>
               </div>
             )}
           </div>
         </div>
       </main>

      {/* Gradient overlay to fade out messages above button */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent pointer-events-none z-40"></div>

      {/* Floating Cast Message Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gray-950 px-4 pb-4 lg:px-0 lg:pb-8 lg:bg-transparent lg:flex lg:justify-center">
          <Button 
            onClick={() => navigate('/cast')}
            className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Cast Anonymous Message
          </Button>
        </div>
      </div>
    </div>
  )
} 