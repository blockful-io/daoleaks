import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Shield } from 'lucide-react'

// Mock data for demonstration
const mockPosts = [
  {
    id: 1,
    votingPower: '>50k',
    tier: 'premium',
    timeAgo: '5 hr. ago',
    content: "In the ever-evolving landscape of decentralized technology, it's crucial to acknowledge the transformative potential of Web3. This new paradigm empowers users by shifting control from centralized entities to individuals, fostering a more equitable digital ecosystem. As we navigate this transition, the importance of community-driven governance and transparency cannot be overstated.",
    author: 'Anonymous Whale',
    verified: true
  },
  {
    id: 2,
    votingPower: '<10k',
    tier: 'basic',
    timeAgo: '10 hr. ago',
    content: "As we navigate the dynamic world of decentralized technologies, it's important to highlight the role of ENS DAO in shaping the future. This innovative approach not only enhances user autonomy but also promotes a collaborative ecosystem where every voice matters.",
    author: 'DAO Member',
    verified: false
  },
  {
    id: 3,
    votingPower: '>10k',
    tier: 'standard',
    timeAgo: '12 hr. ago',
    content: "In the ever-evolving landscape of decentralized technology, it's crucial to acknowledge the transformative potential of Web3. This new paradigm empowers users by shifting control from centralized entities to individuals, fostering a more equitable digital ecosystem.",
    author: 'Crypto Enthusiast',
    verified: true
  }
]

function App() {
  const [selectedFilter, setSelectedFilter] = useState('all')

  const getVotingPowerColor = (votingPower: string) => {
    if (votingPower.includes('>50k')) {
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    } else if (votingPower.includes('>10k')) {
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    } else {
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">DAO_leaks</h1>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Connect
            </Button>
          </div>
        </div>
      </header>

             {/* Main Content */}
       <main className="container mx-auto px-4 py-6 max-w-4xl">

                 {/* Posts Feed */}
         <div className="space-y-4">
           {mockPosts.map((post) => (
             <Card key={post.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
               <CardContent className="p-4">
                 <div className="flex items-center justify-between mb-3">
                   <Badge 
                     className={`${getVotingPowerColor(post.votingPower)} font-mono text-sm`}
                   >
                     {post.votingPower} voting power
                   </Badge>
                   
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
         </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            size="lg"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Load More Leaks
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-500">
            <p className="mb-2">Powered by Zero-Knowledge Proofs</p>
            <p className="text-sm">© 2025 DAO_leaks. Privacy-first transparency.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
