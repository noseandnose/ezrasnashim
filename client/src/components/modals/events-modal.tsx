import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FullscreenModal } from '@/components/ui/fullscreen-modal';
import axiosClient from '@/lib/axiosClient';
import { useLocationStore } from '@/hooks/use-jewish-times';

interface JewishEvent {
  title: string;
  hebrew: string;
  date: string;
  hdate: string;
  category: string;
  subcat: string;
  memo: string;
  yomtov: boolean;
  link: string;
}

interface EventsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventsModal({ isOpen, onClose }: EventsModalProps) {
  const { coordinates } = useLocationStore();
  const [upcomingEventIndex, setUpcomingEventIndex] = useState<number | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['/api/events', coordinates?.lat, coordinates?.lng],
    queryFn: async () => {
      if (!coordinates) return { events: [], location: null };
      const response = await axiosClient.get(`/api/events/${coordinates.lat}/${coordinates.lng}`);
      return response.data;
    },
    enabled: !!coordinates && isOpen,
  });

  // Find the next upcoming event when data loads and scroll to it
  useEffect(() => {
    if (eventsQuery.data?.events) {
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      
      const nextEventIndex = eventsQuery.data.events.findIndex((event: JewishEvent) => {
        const eventDate = new Date(event.date);
        const eventDateString = eventDate.toISOString().split('T')[0];
        return eventDateString >= todayString;
      });
      
      const upcomingIndex = nextEventIndex >= 0 ? nextEventIndex : 0;
      setUpcomingEventIndex(upcomingIndex);
      
      // Scroll to the upcoming event after a brief delay
      setTimeout(() => {
        const upcomingElement = document.getElementById(`event-${upcomingIndex}`);
        if (upcomingElement) {
          upcomingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [eventsQuery.data]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getCategoryDisplay = (category: string, subcat: string) => {
    if (subcat) {
      return `${category} (${subcat})`;
    }
    return category;
  };

  const getTimeDisplay = (title: string) => {
    // Extract time from titles like "Candle lighting: 7:25pm" or "Havdalah: 8:17pm"
    const timeMatch = title.match(/(\d{1,2}:\d{2}(?:am|pm))/i);
    return timeMatch ? timeMatch[1] : '';
  };

  const shouldShowTime = (category: string) => {
    return category === 'candles' || category === 'havdalah';
  };

  if (!isOpen) return null;

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Events"
      showFontControls={false}
    >
      <div className="space-y-3 pb-6">
        {eventsQuery.isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading events...</p>
          </div>
        )}

        {eventsQuery.error && (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load events</p>
          </div>
        )}

        {eventsQuery.data?.events && eventsQuery.data.events.length > 0 && (
          <div className="space-y-3">
            {eventsQuery.data.events.map((event: JewishEvent, index: number) => {
              const isUpcoming = upcomingEventIndex !== null && index === upcomingEventIndex;
              const isPast = upcomingEventIndex !== null && index < upcomingEventIndex;
              
              return (
                <div
                  id={`event-${index}`}
                  key={`${event.date}-${event.title}`}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                    isUpcoming 
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-300 shadow-md scale-105' 
                      : isPast 
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 opacity-75' 
                        : 'bg-gradient-to-r from-white to-rose-25 border-blush/30 hover:shadow-md hover:scale-102'
                  }`}
                >
                  {/* Decorative top border */}
                  <div className={`h-1 w-full ${
                    isUpcoming 
                      ? 'bg-gradient-to-r from-rose-400 to-pink-400' 
                      : isPast 
                        ? 'bg-gradient-to-r from-gray-300 to-slate-300' 
                        : 'bg-gradient-to-r from-blush to-muted-lavender'
                  }`} />
                  
                  <div className="p-4">
                    <div className="flex flex-col space-y-2">
                      {/* Title with badge */}
                      <div className="flex items-center justify-between">
                        <h3 className={`platypi-bold text-lg ${
                          isPast ? 'text-gray-600' : 'text-black'
                        }`}>
                          {event.title}
                        </h3>
                        {isUpcoming && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs platypi-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm">
                            ✨ Next
                          </span>
                        )}
                      </div>

                      {/* Hebrew Date */}
                      {event.hdate && (
                        <div className={`platypi-medium text-sm ${
                          isPast ? 'text-gray-500' : 'text-gray-700'
                        } font-hebrew`}>
                          {event.hdate}
                        </div>
                      )}

                      {/* English Date */}
                      <div className={`platypi-medium text-sm ${
                        isPast ? 'text-gray-500' : 'text-gray-800'
                      }`}>
                        {formatDate(event.date)}
                      </div>

                      {/* Category badge and time */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs platypi-medium ${
                          isPast 
                            ? 'bg-gray-100 text-gray-500' 
                            : isUpcoming
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blush/10 text-blush'
                        }`}>
                          {getCategoryDisplay(event.category, event.subcat)}
                        </span>
                        
                        {shouldShowTime(event.category) && (
                          <div className={`text-sm platypi-semibold ${
                            isPast ? 'text-gray-500' : 'text-black'
                          }`}>
                            {getTimeDisplay(event.title)}
                          </div>
                        )}
                      </div>

                      {/* Memo/Description for holidays */}
                      {event.memo && event.category === 'holiday' && (
                        <div className={`text-xs platypi-regular italic leading-relaxed ${
                          isPast ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {event.memo}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {eventsQuery.data?.events && eventsQuery.data.events.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No events found</p>
          </div>
        )}
      </div>
    </FullscreenModal>
  );
}