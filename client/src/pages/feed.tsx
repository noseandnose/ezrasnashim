import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
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
  onLike: (id: number) => void;
  onDislike: (id: number) => void;
  isLiking: boolean;
  isDisliking: boolean;
  userVote: 'like' | 'dislike' | null;
}

function FeedItem({ message, onLike, onDislike, isLiking, isDisliking, userVote }: FeedItemProps) {
  const category = (message.category as MessageCategory) || 'message';
  const { bg, label } = categoryColors[category];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-blush/10 relative" data-testid={`feed-item-${message.id}`}>
      <div 
        className={`absolute top-3 right-3 w-3 h-3 rounded-full ${bg}`}
        title={label}
      />
      
      <h3 className="platypi-bold text-lg text-black pr-6 mb-2">{message.title}</h3>
      
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
            onClick={() => onLike(message.id)}
            disabled={isLiking || userVote === 'like'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              userVote === 'like' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600'
            } ${isLiking ? 'opacity-50' : ''}`}
            data-testid={`like-button-${message.id}`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-medium">{message.likes || 0}</span>
          </button>
          
          <button
            onClick={() => onDislike(message.id)}
            disabled={isDisliking || userVote === 'dislike'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              userVote === 'dislike' 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600'
            } ${isDisliking ? 'opacity-50' : ''}`}
            data-testid={`dislike-button-${message.id}`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-medium">{message.dislikes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/feed'],
    staleTime: 60 * 1000,
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/feed/${id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
    },
  });

  const dislikeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/feed/${id}/dislike`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
    },
  });

  const getVotesFromStorage = (): Record<number, 'like' | 'dislike'> => {
    try {
      const stored = localStorage.getItem('feedVotes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveVote = (id: number, vote: 'like' | 'dislike') => {
    const votes = getVotesFromStorage();
    votes[id] = vote;
    localStorage.setItem('feedVotes', JSON.stringify(votes));
  };

  const handleLike = (id: number) => {
    const votes = getVotesFromStorage();
    if (votes[id]) return;
    saveVote(id, 'like');
    likeMutation.mutate(id);
  };

  const handleDislike = (id: number) => {
    const votes = getVotesFromStorage();
    if (votes[id]) return;
    saveVote(id, 'dislike');
    dislikeMutation.mutate(id);
  };

  const votes = getVotesFromStorage();

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
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-warm-gray/70 platypi-medium whitespace-nowrap">
                    {formatDateDivider(group.date)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                
                <div className="space-y-3">
                  {group.messages.map((message) => (
                    <FeedItem
                      key={message.id}
                      message={message}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      isLiking={likeMutation.isPending}
                      isDisliking={dislikeMutation.isPending}
                      userVote={votes[message.id] || null}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
