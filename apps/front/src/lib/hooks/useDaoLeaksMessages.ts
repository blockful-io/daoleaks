import { useState, useEffect, useCallback, useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { DAOLEAKS_CONTRACT_ADDRESS, DAOLEAKS_ABI, votingPowerToTier } from '../contracts/daoleaks'
import type { VotingPowerTier } from '@/components/VotingPowerBadge'

export interface DaoLeaksMessage {
  id: number
  message: string
  votingPower: VotingPowerTier
  timeAgo: string
  content: string
  timestamp: bigint
  votingPowerLevel: bigint
}

interface UseDaoLeaksMessagesOptions {
  pageSize?: number
  filters?: VotingPowerTier[]
}

interface ContractMessage {
  message: string
  votingPowerLevel: bigint
  timestamp: bigint
}

export function useDaoLeaksMessages({ 
  pageSize = 5, 
  filters = ['>1k', '>10k', '>50k'] 
}: UseDaoLeaksMessagesOptions = {}) {
  const [allMessages, setAllMessages] = useState<DaoLeaksMessage[]>([])
  const [displayedCount, setDisplayedCount] = useState(pageSize)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Get total messages count
  const { data: totalMessages, isLoading: isLoadingTotal } = useReadContract({
    address: DAOLEAKS_CONTRACT_ADDRESS,
    abi: DAOLEAKS_ABI,
    functionName: 'getTotalMessages',
  })

  // Fetch all messages at once
  const { data: rawMessages, isLoading: isLoadingMessages, refetch } = useReadContract({
    address: DAOLEAKS_CONTRACT_ADDRESS,
    abi: DAOLEAKS_ABI,
    functionName: 'getMessages',
    args: [BigInt(0), totalMessages || BigInt(0)],
    query: {
      enabled: !!DAOLEAKS_CONTRACT_ADDRESS && totalMessages !== undefined && totalMessages > 0,
    }
  })

  // Helper function to format time ago
  const formatTimeAgo = useCallback((timestamp: bigint): string => {
    const now = Math.floor(Date.now() / 1000)
    const messageTime = Number(timestamp)
    const diffInSeconds = now - messageTime

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} min. ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hr. ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      const weeks = Math.floor(diffInSeconds / 604800)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    }
  }, [])

  // Transform and sort messages (newest first)
  const transformAndSortMessages = useCallback((rawMessages: readonly ContractMessage[]): DaoLeaksMessage[] => {
    if (!rawMessages || rawMessages.length === 0) return []
    
    return rawMessages
      .map((msg, index) => {
        const votingPower = votingPowerToTier(msg.votingPowerLevel)
        const timeAgo = formatTimeAgo(msg.timestamp)
        
        return {
          id: index + 1,
          message: msg.message,
          votingPower,
          timeAgo,
          content: msg.message,
          timestamp: msg.timestamp,
          votingPowerLevel: msg.votingPowerLevel
        }
      })
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp)) // Sort newest first
  }, [formatTimeAgo])

  // Filter messages based on selected filters
  const filterMessages = useCallback((messages: DaoLeaksMessage[]): DaoLeaksMessage[] => {
    if (filters.length === 0) return messages
    return messages.filter(msg => filters.includes(msg.votingPower))
  }, [filters])

  // Get filtered messages
  const filteredMessages = useMemo(() => {
    return filterMessages(allMessages)
  }, [allMessages, filterMessages])

  // Get currently displayed messages
  const displayedMessages = useMemo(() => {
    return filteredMessages.slice(0, displayedCount)
  }, [filteredMessages, displayedCount])

  // Check if there are more messages to load
  const hasMore = useMemo(() => {
    return displayedCount < filteredMessages.length
  }, [displayedCount, filteredMessages.length])

  // Load more messages (for infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    
    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300))
      setDisplayedCount(prev => prev + pageSize)
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, pageSize])

  // Reset pagination when filters change
  const resetPagination = useCallback(() => {
    setDisplayedCount(pageSize)
  }, [pageSize])

  // Update all messages when new data arrives
  useEffect(() => {
    if (rawMessages && rawMessages.length > 0) {
      const transformedMessages = transformAndSortMessages(rawMessages as readonly ContractMessage[])
      setAllMessages(transformedMessages)
    } else {
      setAllMessages([])
    }
  }, [rawMessages, transformAndSortMessages])

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(pageSize)
  }, [filters, pageSize])

  const isLoading = isLoadingTotal || isLoadingMessages

  return {
    messages: displayedMessages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    resetPagination,
    totalMessages: totalMessages ? Number(totalMessages) : 0,
    refetch
  }
}