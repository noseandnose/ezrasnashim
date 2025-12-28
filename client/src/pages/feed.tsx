import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ThumbsUp, ThumbsDown, ArrowLeft, Pin } from "lucide-react";
import { Link } from "wouter";
import type { Message, MessageCategory } from "@shared/schema";
import { linkifyText } from "@/lib/text-formatter";
import { queryClient, apiRequest } from "@/lib/queryClient";

const categoryColors: Record<MessageCategory, { bg: string; label: string }> = {
  message: { bg: "bg-yellow-400", label: "Message" },
  feature: { bg: "bg-blue-400", label: "New Feature" },
  bugfix: { bg: "bg-pink-400", label: "Bug Fix" },
  poll: { bg: "bg-green-400", label: "Poll" },
};

function formatDateDivider(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

function formatTime(createdAt: Date | string | null, dateStr: string): string {
  if (createdAt) {
    const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
    if (!isNaN(date.getTime())) {
      return format(date, "h:mm a");
    }
  }
  return format(parseISO(dateStr), "h:mm a");
}

interface FeedItemProps {
  message: Message;
  onLike: (id: number, currentVote: 'like' | 'dislike' | null) => void;
  onDislike: (id: number, currentVote: 'like' | 'dislike' | null) => void;
  onUnlike: (id: number) => void;
  onUndislike: (id: number) => void;
  isVoting: boolean;
  userVote: 'like' | 'dislike' | null;
  optimisticLikes: number;
  optimisticDislikes: number;
  isTodaysMessage?: boolean;
}

function FeedItem({ message, onLike, onDislike, onUnlike, onUndislike, isVoting, userVote, optimisticLikes, optimisticDislikes, isTodaysMessage }: FeedItemProps) {
  const category = (message.category as MessageCategory) || 'message';
  const { bg, label } = categoryColors[category];

  const handleLikeClick = () => {
    if (userVote === 'like') {
      onUnlike(message.id);
    } else {
      onLike(message.id, userVote);
    }
  };

  const handleDislikeClick = () => {
    if (userVote === 'dislike') {
      onUndislike(message.id);
    } else {
      onDislike(message.id, userVote);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl p-4 shadow-sm relative ${
        isTodaysMessage 
          ? 'ring-2 ring-blush/60 animate-pulse-glow' 
          : 'border border-blush/10'
      }`} 
      style={isTodaysMessage ? {
        background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #E8ADB7 0%, #F5D0D6 50%, #E8ADB7 100%) border-box',
      } : undefined}
      data-testid={`feed-item-${message.id}`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {message.isPinned && (
          <Pin className="w-3.5 h-3.5 text-blush fill-blush" />
        )}
        <div 
          className={`w-3 h-3 rounded-full ${bg}`}
          title={label}
        />
      </div>
      
      <h3 className="platypi-bold text-lg text-black pr-8 mb-2">{message.title}</h3>
      
      <div 
        className="text-warm-gray platypi-medium leading-relaxed mb-3"
        dangerouslySetInnerHTML={{ __html: linkifyText(message.message) }}
      />
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-warm-gray/60">
          {formatTime(message.createdAt, message.date)}
        </span>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleLikeClick}
            disabled={isVoting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              userVote === 'like' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600'
            } ${isVoting ? 'opacity-50' : ''}`}
            data-testid={`like-button-${message.id}`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-medium">{optimisticLikes}</span>
          </button>
          
          <button
            onClick={handleDislikeClick}
            disabled={isVoting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              userVote === 'dislike' 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600'
            } ${isVoting ? 'opacity-50' : ''}`}
            data-testid={`dislike-button-${message.id}`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-medium">{optimisticDislikes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const [votes, setVotes] = useState<Record<number, 'like' | 'dislike'>>(() => {
    try {
      const stored = localStorage.getItem('feedVotes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  
  const [pendingVotes, setPendingVotes] = useState<Set<number>>(new Set());

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/feed'],
    staleTime: 60 * 1000,
  });

  const saveVotes = useCallback((newVotes: Record<number, 'like' | 'dislike'>) => {
    setVotes(newVotes);
    localStorage.setItem('feedVotes', JSON.stringify(newVotes));
  }, []);

  const handleVote = async (id: number, action: 'like' | 'dislike' | 'unlike' | 'undislike') => {
    if (pendingVotes.has(id)) return;
    
    setPendingVotes(prev => new Set(prev).add(id));
    
    const currentVote = votes[id] || null;
    
    try {
      if (action === 'like') {
        if (currentVote === 'dislike') {
          await apiRequest('DELETE', `/api/feed/${id}/dislike`);
        }
        await apiRequest('POST', `/api/feed/${id}/like`);
        saveVotes({ ...votes, [id]: 'like' });
      } else if (action === 'dislike') {
        if (currentVote === 'like') {
          await apiRequest('DELETE', `/api/feed/${id}/like`);
        }
        await apiRequest('POST', `/api/feed/${id}/dislike`);
        saveVotes({ ...votes, [id]: 'dislike' });
      } else if (action === 'unlike') {
        await apiRequest('DELETE', `/api/feed/${id}/like`);
        const newVotes = { ...votes };
        delete newVotes[id];
        saveVotes(newVotes);
      } else if (action === 'undislike') {
        await apiRequest('DELETE', `/api/feed/${id}/dislike`);
        const newVotes = { ...votes };
        delete newVotes[id];
        saveVotes(newVotes);
      }
      
      await queryClient.refetchQueries({ queryKey: ['/api/feed'] });
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setPendingVotes(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleLike = (id: number, currentVote: 'like' | 'dislike' | null) => {
    if (currentVote === 'like') return;
    handleVote(id, 'like');
  };

  const handleDislike = (id: number, currentVote: 'like' | 'dislike' | null) => {
    if (currentVote === 'dislike') return;
    handleVote(id, 'dislike');
  };

  const handleUnlike = (id: number) => {
    handleVote(id, 'unlike');
  };

  const handleUndislike = (id: number) => {
    handleVote(id, 'undislike');
  };

  const isVotingMessage = (id: number) => pendingVotes.has(id);

  const groupedMessages: { date: string; messages: Message[] }[] = [];
  if (messages) {
    let currentDate = '';
    for (const msg of messages) {
      if (msg.date !== currentDate) {
        currentDate = msg.date;
        groupedMessages.push({ date: currentDate, messages: [msg] });
      } else {
        groupedMessages[groupedMessages.length - 1].messages.push(msg);
      }
    }
  }

  return (
    <div className="mobile-app" style={{ 
      background: 'linear-gradient(180deg, hsl(350, 45%, 98%) 0%, hsl(260, 30%, 98%) 50%, hsl(350, 45%, 96%) 100%)',
      minHeight: '100vh'
    }}>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blush/10">
        <div className="flex items-center px-4 py-3">
          <Link href="/" className="p-2 -ml-2" data-testid="back-button">
            <ArrowLeft className="w-5 h-5 text-black" />
          </Link>
          <h1 className="platypi-bold text-xl text-black ml-2">Feed</h1>
        </div>
      </header>
      
      <main className="content-area px-4 py-4 pb-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blush/30 border-t-blush rounded-full animate-spin" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-warm-gray platypi-medium">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              let highlightedTodaysMessage = false;
              return groupedMessages.map((group, groupIndex) => (
                <div key={group.date}>
                  <div className={`flex items-center gap-3 ${groupIndex === 0 ? 'mb-4' : 'my-4'}`}>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-warm-gray/70 platypi-medium whitespace-nowrap">
                      {formatDateDivider(group.date)}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  
                  <div className="space-y-3">
                    {group.messages.map((message) => {
                      const messageDate = parseISO(message.date);
                      const isTodayMsg = isToday(messageDate);
                      const shouldHighlight = isTodayMsg && !highlightedTodaysMessage;
                      if (shouldHighlight) highlightedTodaysMessage = true;
                      return (
                        <FeedItem
                          key={message.id}
                          message={message}
                          onLike={handleLike}
                          onDislike={handleDislike}
                          onUnlike={handleUnlike}
                          onUndislike={handleUndislike}
                          isVoting={isVotingMessage(message.id)}
                          userVote={votes[message.id] || null}
                          optimisticLikes={message.likes || 0}
                          optimisticDislikes={message.dislikes || 0}
                          isTodaysMessage={shouldHighlight}
                        />
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
