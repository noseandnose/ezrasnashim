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


  const getTimeDisplay = (title: string) => {
    // Extract time from titles like "Candle lighting: 7:25pm" or "Havdalah: 8:17pm"
    const timeMatch = title.match(/(\d{1,2}:\d{2}(?:am|pm))/i);
    return timeMatch ? timeMatch[1] : '';
  };

  const shouldShowTime = (category: string) => {
    return category === 'candles' || category === 'havdalah';
  };

  const getEventEmoji = (title: string, category: string) => {
    const titleLower = title.toLowerCase();
    
    // High holidays and major events
    if (titleLower.includes('rosh hashana')) return '🍎';
    if (titleLower.includes('yom kippur')) return '🕯️';
    if (titleLower.includes('sukkot')) return '🌿';
    if (titleLower.includes('simchat torah')) return '📜';
    if (titleLower.includes('shemini atzeret')) return '🌧️';
    if (titleLower.includes('pesach') || titleLower.includes('passover')) return '🍷';
    if (titleLower.includes('shavuot')) return '🌾';
    if (titleLower.includes('chanukah') || titleLower.includes('hanukkah')) return '🕎';
    if (titleLower.includes('purim')) return '🎭';
    if (titleLower.includes('tu bishvat')) return '🌳';
    if (titleLower.includes('lag baomer')) return '🔥';
    if (titleLower.includes('tu bav')) return '💖';
    
    // Fast days
    if (category === 'fastday' || titleLower.includes('fast')) return '⚡';
    
    // Rosh Chodesh
    if (category === 'roshchodesh' || titleLower.includes('rosh chodesh')) return '🌙';
    
    // Special Shabbatot
    if (titleLower.includes('shabbat')) return '✨';
    
    // Candles and Havdalah
    if (category === 'candles' || titleLower.includes('candle')) return '🕯️';
    if (category === 'havdalah') return '🌟';
    
    // Modern holidays
    if (titleLower.includes('yom hashoah')) return '🕯️';
    if (titleLower.includes('yom hazikaron')) return '🇮🇱';
    if (titleLower.includes('yom haatzmaut')) return '🎉';
    if (titleLower.includes('yom yerushalayim')) return '🏛️';
    
    // Default for any holiday
    if (category === 'holiday') return '🎊';
    
    return '📅'; // Default for other events
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
                  className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                    isUpcoming 
                      ? 'bg-gradient-to-r from-blush/20 to-muted-lavender/20 border-blush shadow-md scale-102' 
                      : isPast 
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 opacity-75' 
                        : 'bg-gradient-to-r from-white to-blush/10 border-blush/30 hover:shadow-sm hover:scale-101'
                  }`}
                >
                  {/* Decorative top border */}
                  <div className={`h-1 w-full ${
                    isUpcoming 
                      ? 'bg-gradient-to-r from-blush to-muted-lavender' 
                      : isPast 
                        ? 'bg-gradient-to-r from-gray-300 to-slate-300' 
                        : 'bg-gradient-to-r from-blush to-muted-lavender'
                  }`} />
                  
                  <div className="p-3">
                    <div className="flex flex-col space-y-1.5">
                      {/* Title with badge */}
                      <div className="flex items-center justify-between">
                        <h3 className={`platypi-bold text-base ${
                          isPast ? 'text-gray-600' : 'text-black'
                        }`}>
                          <span className="mr-2">{getEventEmoji(event.title, event.category)}</span>
                          {event.title}
                          {shouldShowTime(event.category) && getTimeDisplay(event.title) && (
                            <span className={`ml-2 text-sm platypi-medium ${
                              isPast ? 'text-gray-500' : 'text-black/70'
                            }`}>
                              {getTimeDisplay(event.title)}
                            </span>
                          )}
                        </h3>
                        {isUpcoming && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs platypi-semibold bg-gradient-to-r from-blush to-muted-lavender text-black shadow-sm">
                            ✨ Next
                          </span>
                        )}
                      </div>

                      {/* Combined Date Line */}
                      <div className={`platypi-medium text-sm ${
                        isPast ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {formatDate(event.date)}
                        {event.hdate && (
                          <span className="font-hebrew ml-2">
                            • {event.hdate}
                          </span>
                        )}
                      </div>
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