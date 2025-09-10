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

  // Find the next upcoming event when data loads
  useEffect(() => {
    if (eventsQuery.data?.events) {
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      
      const nextEventIndex = eventsQuery.data.events.findIndex((event: JewishEvent) => {
        const eventDate = new Date(event.date);
        const eventDateString = eventDate.toISOString().split('T')[0];
        return eventDateString >= todayString;
      });
      
      setUpcomingEventIndex(nextEventIndex >= 0 ? nextEventIndex : 0);
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
          <div className="space-y-2">
            {eventsQuery.data.events.map((event: JewishEvent, index: number) => {
              const isUpcoming = upcomingEventIndex !== null && index === upcomingEventIndex;
              const isPast = upcomingEventIndex !== null && index < upcomingEventIndex;
              
              return (
                <div
                  key={`${event.date}-${event.title}`}
                  className={`p-4 rounded-lg border ${
                    isUpcoming 
                      ? 'bg-rose-50 border-rose-200 shadow-sm' 
                      : isPast 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-col space-y-1">
                    {/* Title */}
                    <div className="font-semibold text-gray-900">
                      {event.title}
                      {isUpcoming && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                          Next
                        </span>
                      )}
                    </div>

                    {/* Hebrew Date */}
                    {event.hdate && (
                      <div className="text-sm text-gray-600 font-hebrew">
                        {event.hdate}
                      </div>
                    )}

                    {/* English Date */}
                    <div className="text-sm text-gray-700">
                      {formatDate(event.date)}
                    </div>

                    {/* Category and Time */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {getCategoryDisplay(event.category, event.subcat)}
                      </div>
                      
                      {shouldShowTime(event.category) && (
                        <div className="text-sm font-medium text-gray-700">
                          {getTimeDisplay(event.title)}
                        </div>
                      )}
                    </div>

                    {/* Memo/Description for holidays */}
                    {event.memo && event.category === 'holiday' && (
                      <div className="text-xs text-gray-500 mt-1 italic">
                        {event.memo}
                      </div>
                    )}
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