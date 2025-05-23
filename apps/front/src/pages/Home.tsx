import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, MessageCircle, Loader2, Filter, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { VotingPowerBadge, type VotingPowerTier } from '@/components/VotingPowerBadge'
import { useState, useEffect, useRef } from 'react'
import { useDaoLeaksMessages } from '@/lib/hooks/useDaoLeaksMessages'
import { DAOLEAKS_CONTRACT_ADDRESS } from '@/lib/contracts/daoleaks'

const POSTS_PER_PAGE = 5

type FilterTier = VotingPowerTier

export default function Home() {
  const navigate = useNavigate()
  const [selectedFilters, setSelectedFilters] = useState<FilterTier[]>(['>1k', '>10k', '>50k'])
  const loadingRef = useRef<HTMLDivElement>(null)

  // Use the contract hook
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    resetPagination,
    totalMessages
  } = useDaoLeaksMessages({
    pageSize: POSTS_PER_PAGE,
    filters: selectedFilters
  })

  const toggleFilter = (filter: FilterTier) => {
    setSelectedFilters(prev => {
      const newFilters = prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
      
      // Reset pagination when filters change
      resetPagination()
      
      return newFilters
    })
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
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
  }, [loadMore, hasMore, isLoadingMore])

  // Show error if contract address is not configured
  if (!DAOLEAKS_CONTRACT_ADDRESS) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <Card className="bg-red-900/20 border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400">Contract Not Configured</h3>
                  <p className="text-red-300 mt-1">
                    Please set VITE_DAOLEAKS_CONTRACT_ADDRESS in your environment variables.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

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
        
        {/* Total messages count */}
        {totalMessages > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            Total messages: {totalMessages}
          </div>
        )}
      </div>

       {/* Main Content */}
       <main className="container mx-auto px-4 py-6 max-w-4xl pb-32">
         {/* Loading state for initial load */}
         {isLoading && (
           <div className="flex justify-center py-12">
             <div className="flex items-center gap-2 text-gray-500">
               <Loader2 className="w-6 h-6 animate-spin" />
               <span>Loading messages from blockchain...</span>
             </div>
           </div>
         )}

         {/* No messages state */}
         {!isLoading && messages.length === 0 && (
           <Card className="bg-gray-900/50 border-gray-800">
             <CardContent className="p-8 text-center">
               <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
               <h3 className="text-lg font-semibold text-gray-400 mb-2">No messages found</h3>
               <p className="text-gray-500 mb-4">
                 {selectedFilters.length === 0 
                   ? "No messages have been posted yet." 
                   : "No messages match your current filters."}
               </p>
               <Button 
                 onClick={() => navigate('/cast')}
                 className="bg-green-600 hover:bg-green-700 text-white"
               >
                 <MessageCircle className="w-4 h-4 mr-2" />
                 Be the first to post
               </Button>
             </CardContent>
           </Card>
         )}

         {/* Messages list */}
         <div className="space-y-4">
           {messages.map((message) => (
             <Card key={message.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
               <CardContent className="p-4">
                 <div className="flex items-center justify-between mb-3">
                   <VotingPowerBadge tier={message.votingPower} />
                   
                   <div className="flex items-center gap-1 text-sm text-gray-500">
                     <Clock className="w-4 h-4" />
                     {message.timeAgo}
                   </div>
                 </div>
                 
                 <p className="text-gray-300 leading-relaxed">
                   {message.content}
                 </p>
               </CardContent>
             </Card>
           ))}
           
           {/* Loading indicator and infinite scroll trigger */}
           <div ref={loadingRef} className="flex justify-center py-8">
             {isLoadingMore && (
               <div className="flex items-center gap-2 text-gray-500">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <span>Loading more messages...</span>
               </div>
             )}
             {!hasMore && messages.length > 0 && (
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