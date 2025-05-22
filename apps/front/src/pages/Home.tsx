import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { VotingPowerBadge, type VotingPowerTier } from '@/components/VotingPowerBadge'

// Mock data for demonstration
const mockPosts = [
  {
    id: 1,
    votingPower: '>50k' as VotingPowerTier,
    timeAgo: '5 hr. ago',
    content: "In the ever-evolving landscape of decentralized technology, it's crucial to acknowledge the transformative potential of Web3. This new paradigm empowers users by shifting control from centralized entities to individuals, fostering a more equitable digital ecosystem. As we navigate this transition, the importance of community-driven governance and transparency cannot be overstated.",
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
  }
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />

       {/* Main Content */}
       <main className="container mx-auto px-4 py-6 max-w-4xl pb-32">
         <div className="space-y-4">
           {mockPosts.map((post) => (
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
         </div>
       </main>



      {/* Floating Cast Message Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Gradient overlay to fade out messages */}
        <div className="h-24 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none"></div>
        
        {/* Button container */}
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