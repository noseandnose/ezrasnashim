import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FullscreenModal } from '@/components/ui/fullscreen-modal';
import axiosClient from '@/lib/axiosClient';
import { useLocationStore, useJewishTimes } from '@/hooks/use-jewish-times';
import { Clock, Calendar, MapPin } from 'lucide-react';
import { useBackButtonHistory } from '@/hooks/use-back-button-history';

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
  // Register with back button history for Android WebView support
  useBackButtonHistory({ id: 'events-modal', isOpen, onClose });
  const { coordinates } = useLocationStore();
  const [upcomingEventIndex, setUpcomingEventIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'zmanim' | 'days'>('zmanim');
  const jewishTimesQuery = useJewishTimes();

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
    }
  }, [eventsQuery.data]);

  // Scroll to upcoming event whenever Days tab is shown
  useEffect(() => {
    if (isOpen && activeTab === 'days' && upcomingEventIndex !== null && eventsQuery.data?.events) {
      setTimeout(() => {
        const upcomingElement = document.getElementById(`event-${upcomingEventIndex}`);
        if (upcomingElement) {
          upcomingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen, activeTab, upcomingEventIndex, eventsQuery.data]);

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
    const timeMatch = title.match(/(\d{1,2}:\d{2}(?:am|pm))/i);
    return timeMatch ? timeMatch[1] : '';
  };

  const shouldShowTime = (category: string) => {
    return category === 'candles' || category === 'havdalah';
  };

  const getEventEmoji = (title: string, category: string, subcat?: string) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('rosh hashana')) return '🍎';
    if (titleLower.includes('yom kippur')) return '⚡';
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
    
    if (subcat === 'fast' || titleLower.includes('fast of') || titleLower.includes("ta'anit") || 
        titleLower.includes('tzom') || titleLower.includes('asara b\'tevet') || 
        titleLower.includes('tisha b\'av') || titleLower.includes('gedaliah')) return '🚫🍽️';
    
    if (category === 'roshchodesh' || titleLower.includes('rosh chodesh')) return '🌙';
    if (titleLower.includes('shabbat')) return '✨';
    if (category === 'candles' || titleLower.includes('candle')) return '🕯️';
    if (category === 'havdalah') return '🌟';
    if (titleLower.includes('yom hashoah')) return '🕯️';
    if (titleLower.includes('yom hazikaron')) return '🇮🇱';
    if (titleLower.includes('yom haatzmaut')) return '🎉';
    if (titleLower.includes('yom yerushalayim')) return '🏛️';
    if (category === 'holiday') return '🎊';
    
    return '📅';
  };

  const times = jewishTimesQuery.data;

  if (!isOpen) return null;

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Important Days and Times"
      showFontControls={false}
    >
      {/* Tab Navigation - Sticky so it stays visible when scrolling, flush with header */}
      <div className="sticky z-10 bg-white pb-4" style={{ top: '-1rem', margin: '0 -1rem', padding: '1rem 1rem 1rem 1rem', boxShadow: '0 2px 4px -2px rgba(0,0,0,0.05)' }}>
        <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-blush/10">
          <button
            onClick={() => setActiveTab('zmanim')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
              activeTab === 'zmanim'
                ? 'bg-gradient-feminine text-white shadow-lg'
                : 'text-black/60 hover:text-black hover:bg-blush/5'
            }`}
            data-testid="tab-zmanim"
          >
            <Clock size={16} />
            Zmanim
          </button>
          <button
            onClick={() => setActiveTab('days')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
              activeTab === 'days'
                ? 'bg-gradient-feminine text-white shadow-lg'
                : 'text-black/60 hover:text-black hover:bg-blush/5'
            }`}
            data-testid="tab-days"
          >
            <Calendar size={16} />
            Days
          </button>
        </div>
      </div>

      {/* Zmanim Tab Content */}
      {activeTab === 'zmanim' && (
        <div className="space-y-4 pb-6">
          {/* Location Display */}
          {times?.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <MapPin size={14} className="text-blush" />
              <span>{times.location}</span>
            </div>
          )}

          {jewishTimesQuery.isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading times...</p>
            </div>
          )}

          {jewishTimesQuery.error && (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load times</p>
            </div>
          )}

          {times && (
            <div className="space-y-2">
              {/* Morning Times */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <h3 className="platypi-bold text-sm text-amber-800 mb-3 flex items-center gap-2">
                  🌅 Morning
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Alos Hashachar (Dawn)</span>
                    <span className="platypi-semibold text-black">{times.alosHashachar || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Sunrise (Netz)</span>
                    <span className="platypi-semibold text-black">{times.sunrise || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Sof Zman Tefilla</span>
                    <span className="platypi-semibold text-black">{times.sofZmanTfilla || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Midday Times */}
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200">
                <h3 className="platypi-bold text-sm text-sky-800 mb-3 flex items-center gap-2">
                  ☀️ Midday
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Chatzos (Midday)</span>
                    <span className="platypi-semibold text-black">{times.chatzos || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Mincha Gedolah</span>
                    <span className="platypi-semibold text-black">{times.minchaGedolah || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Mincha Ketanah</span>
                    <span className="platypi-semibold text-black">{times.minchaKetanah || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Evening Times */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <h3 className="platypi-bold text-sm text-purple-800 mb-3 flex items-center gap-2">
                  🌆 Evening
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Plag Hamincha</span>
                    <span className="platypi-semibold text-black">{times.plagHamincha || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Shkia (Sunset)</span>
                    <span className="platypi-semibold text-black">{times.shkia || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tzait Hakochavim</span>
                    <span className="platypi-semibold text-black">{times.tzaitHakochavim || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Night Times */}
              <div className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-xl p-4 border border-slate-300">
                <h3 className="platypi-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                  🌙 Night
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Chatzot Night (Midnight)</span>
                    <span className="platypi-semibold text-black">{times.chatzotNight || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Shabbat Times (only show if available) */}
              {(times.candleLighting || times.havdalah) && (
                <div className="bg-gradient-to-r from-blush/20 to-lavender/20 rounded-xl p-4 border border-blush/30">
                  <h3 className="platypi-bold text-sm text-blush mb-3 flex items-center gap-2">
                    🕯️ Shabbat
                  </h3>
                  <div className="space-y-2 text-sm">
                    {times.candleLighting && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Candle Lighting</span>
                        <span className="platypi-semibold text-black">{times.candleLighting}</span>
                      </div>
                    )}
                    {times.havdalah && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Havdalah</span>
                        <span className="platypi-semibold text-black">{times.havdalah}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Days Tab Content */}
      {activeTab === 'days' && (
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
                    <div className={`h-1 w-full ${
                      isUpcoming 
                        ? 'bg-gradient-to-r from-blush to-muted-lavender' 
                        : isPast 
                          ? 'bg-gradient-to-r from-gray-300 to-slate-300' 
                          : 'bg-gradient-to-r from-blush to-muted-lavender'
                    }`} />
                    
                    <div className="p-3">
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className={`platypi-bold text-base ${
                            isPast ? 'text-gray-600' : 'text-black'
                          }`}>
                            <span className="mr-2">{getEventEmoji(event.title, event.category, event.subcat)}</span>
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
      )}
    </FullscreenModal>
  );
}
