import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchRecord, createSearchIndex } from '@/lib/searchUtils';
import { useModalStore } from '@/lib/types';
import type MiniSearch from 'minisearch';

interface SearchContextValue {
  searchIndex: SearchRecord[];
  miniSearchIndex: MiniSearch<any> | null;
  isLoading: boolean;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const { openModal } = useModalStore();
  
  // Get today's date for content queries
  const today = new Date().toISOString().split('T')[0];
  
  // Torah content queries
  const { data: halachaContent } = useQuery<{title?: string; englishTitle?: string; hebrewTitle?: string}>({ 
    queryKey: ['/api/torah/halacha', today],
    staleTime: 15 * 60 * 1000,
  });
  const { data: chizukContent } = useQuery<{title?: string; englishTitle?: string; hebrewTitle?: string}>({ 
    queryKey: ['/api/torah/chizuk', today],
    staleTime: 15 * 60 * 1000,
  });
  const { data: emunaContent } = useQuery<{title?: string; englishTitle?: string; hebrewTitle?: string}>({ 
    queryKey: ['/api/torah/emuna', today],
    staleTime: 15 * 60 * 1000,
  });
  
  // Prayer queries - curated content updated via admin, cache for 12 hours
  const { data: minchaPrayers } = useQuery<any[]>({ 
    queryKey: ['/api/mincha/prayers'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  const { data: maarivPrayers } = useQuery<any[]>({ 
    queryKey: ['/api/maariv/prayers'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  const { data: morningPrayers } = useQuery<any[]>({ 
    queryKey: ['/api/morning/prayers'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  
  // Brochas queries - curated content updated via admin, cache for 12 hours
  const { data: dailyBrochas } = useQuery<any[]>({ 
    queryKey: ['/api/brochas/daily'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  const { data: specialBrochas } = useQuery<any[]>({ 
    queryKey: ['/api/brochas/special'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  
  // Life page queries
  const { data: recipeContent } = useQuery<any>({ 
    queryKey: ['/api/table/recipe'],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
  const { data: pirkeiAvot } = useQuery<any>({ 
    queryKey: ['/api/pirkei-avot'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  const { data: marriageInsight } = useQuery<any>({ 
    queryKey: [`/api/marriage-insights/${today}`],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
  
  // Women's prayers queries - curated content updated via admin, cache for 12 hours
  const { data: refuahPrayers } = useQuery<any[]>({ 
    queryKey: ['/api/womens-prayers/refuah'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  const { data: familyPrayers } = useQuery<any[]>({ 
    queryKey: ['/api/womens-prayers/family'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  const { data: lifePrayers } = useQuery<any[]>({ 
    queryKey: ['/api/womens-prayers/life'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (admin can update)
  });
  
  const searchIndex = useMemo(() => {
    const index: SearchRecord[] = [];
    
    // Torah Content
    if (halachaContent) {
      index.push({
        id: 'torah-halacha',
        category: 'Torah',
        title: 'Learn Shabbas',
        secondaryText: halachaContent.englishTitle || halachaContent.title || 'Halachic insights',
        keywords: ['halacha', 'הלכה', 'law', 'torah', 'תורה', 'daily', 'learn', 'shabbas', 'shabbat', 'שבת', 'learn shabbas', halachaContent.englishTitle, halachaContent.hebrewTitle, halachaContent.title].filter(Boolean) as string[],
        modalId: 'halacha',
        action: () => openModal('halacha')
      });
    }
    
    if (chizukContent) {
      index.push({
        id: 'torah-chizuk',
        category: 'Torah',
        title: 'Daily Chizuk',
        secondaryText: chizukContent.englishTitle || chizukContent.title || 'Spiritual strength',
        keywords: ['chizuk', 'חיזוק', 'inspiration', 'torah', 'תורה', 'daily', 'strength', 'encouragement', chizukContent.englishTitle, chizukContent.hebrewTitle, chizukContent.title].filter(Boolean) as string[],
        modalId: 'chizuk',
        action: () => openModal('chizuk')
      });
    }
    
    if (emunaContent) {
      index.push({
        id: 'torah-emuna',
        category: 'Torah',
        title: 'Daily Emuna',
        secondaryText: emunaContent.englishTitle || emunaContent.title || 'Faith & trust',
        keywords: ['emuna', 'אמונה', 'faith', 'torah', 'תורה', 'daily', 'trust', 'belief', emunaContent.englishTitle, emunaContent.hebrewTitle, emunaContent.title].filter(Boolean) as string[],
        modalId: 'emuna',
        action: () => openModal('emuna')
      });
    }
    
    // Prayers
    // Mincha
    index.push({
      id: 'prayer-mincha',
      category: 'Tefilla',
      title: 'Mincha',
      secondaryText: 'מנחה',
      keywords: ['mincha', 'minchah', 'מנחה', 'afternoon', 'prayer', 'tefilla', 'tefillah'],
      modalId: 'mincha',
      action: () => openModal('mincha')
    });
    
    // Maariv
    index.push({
      id: 'prayer-maariv',
      category: 'Tefilla',
      title: 'Maariv',
      secondaryText: 'מעריב',
      keywords: ['maariv', 'maariv', 'מעריב', 'evening', 'prayer', 'night', 'tefilla', 'tefillah', 'arvit'],
      modalId: 'maariv',
      action: () => openModal('maariv')
    });
    
    // Morning Brochas - Main modal
    index.push({
      id: 'prayer-morning-brochas',
      category: 'Tefilla',
      title: 'Morning Brochas',
      secondaryText: 'ברכות השחר',
      keywords: ['morning', 'brochas', 'brachot', 'blessings', 'ברכות', 'berachot', 'השחר', 'hashachar', 'shacharit', 'שחרית', 'tefilla', 'tefillah'],
      modalId: 'morning-brochas',
      action: () => openModal('morning-brochas')
    });
    
    // Brochas (Daily and Special) - Main category
    index.push({
      id: 'prayer-brochas',
      category: 'Tefilla',
      title: 'Brochas',
      secondaryText: 'ברכות',
      keywords: ['brochas', 'blessings', 'ברכות', 'daily', 'special', 'tefilla'],
      modalId: 'brochas',
      action: () => openModal('brochas', 'tefilla')
    });
    
    // Individual Daily Brochas
    if (dailyBrochas && Array.isArray(dailyBrochas)) {
      dailyBrochas.forEach((brocha: any) => {
        const title = brocha.title || brocha.englishTitle || brocha.hebrewTitle;
        const secondary = brocha.description || brocha.hebrewTitle;
        index.push({
          id: `daily-brocha-${brocha.id}`,
          category: 'Brochas',
          title: title,
          secondaryText: secondary,
          keywords: ['brocha', 'blessing', 'ברכה', 'daily', title, secondary].filter(Boolean),
          modalId: 'brochas',
          action: () => {
            // Store the brocha ID and open individual brocha fullscreen
            (window as any).selectedBrochaId = brocha.id;
            const openEvent = new CustomEvent('openDirectFullscreen', {
              detail: {
                title: brocha.title,
                contentType: 'individual-brocha',
                hasTranslation: true
              }
            });
            window.dispatchEvent(openEvent);
          }
        });
      });
    }
    
    // Individual Special Brochas
    if (specialBrochas && Array.isArray(specialBrochas)) {
      specialBrochas.forEach((brocha: any) => {
        const title = brocha.title || brocha.englishTitle || brocha.hebrewTitle;
        const secondary = brocha.description || brocha.hebrewTitle;
        index.push({
          id: `special-brocha-${brocha.id}`,
          category: 'Brochas',
          title: title,
          secondaryText: secondary,
          keywords: ['brocha', 'blessing', 'ברכה', 'special', title, secondary].filter(Boolean),
          modalId: 'brochas',
          action: () => {
            // Store the brocha ID and open individual brocha fullscreen
            (window as any).selectedBrochaId = brocha.id;
            const openEvent = new CustomEvent('openDirectFullscreen', {
              detail: {
                title: brocha.title,
                contentType: 'individual-brocha',
                hasTranslation: true
              }
            });
            window.dispatchEvent(openEvent);
          }
        });
      });
    }
    
    // Nishmas
    index.push({
      id: 'prayer-nishmas',
      category: 'Tefilla',
      title: 'Nishmas',
      secondaryText: 'נשמת',
      keywords: ['nishmas', 'nishmat', 'neshamas', 'נשמת', 'shabbat', 'shabbos', 'שבת', 'prayer', 'tefilla', 'tefillah'],
      modalId: 'nishmas',
      action: () => openModal('nishmas')
    });
    
    // Women's Prayers - Personal Prayer Categories
    index.push({
      id: 'prayer-refuah',
      category: 'Tefilla',
      title: 'Refuah',
      secondaryText: 'Healing',
      keywords: ['refuah', 'refua', 'healing', 'health', 'prayer', 'women', 'womens', 'personal', 'tefilla', 'רפואה'],
      modalId: 'refuah',
      action: () => openModal('refuah', 'tefilla')
    });
    
    index.push({
      id: 'prayer-family',
      category: 'Tefilla',
      title: 'Family',
      secondaryText: 'Peace in Home',
      keywords: ['family', 'home', 'peace', 'shalom', 'bayit', 'prayer', 'women', 'womens', 'personal', 'tefilla', 'משפחה', 'שלום בית'],
      modalId: 'family',
      action: () => openModal('family', 'tefilla')
    });
    
    index.push({
      id: 'prayer-life',
      category: 'Tefilla',
      title: 'Life',
      secondaryText: 'Guidance',
      keywords: ['life', 'guidance', 'personal', 'prayer', 'women', 'womens', 'tefilla', 'חיים', 'הדרכה'],
      modalId: 'life',
      action: () => openModal('life', 'tefilla')
    });
    
    // Individual Women's Prayers - Refuah
    if (refuahPrayers) {
      refuahPrayers.forEach(prayer => {
        index.push({
          id: `womens-prayer-refuah-${prayer.id}`,
          category: 'Tefilla',
          title: prayer.prayerName,
          secondaryText: prayer.description || 'Healing Prayer',
          keywords: ['women', 'womens', 'prayer', 'refuah', 'healing', 'health', 'tefilla', prayer.prayerName].filter(Boolean),
          modalId: 'refuah',
          action: () => {
            openModal('refuah', 'tefilla');
            // Small delay to ensure modal is open before selecting prayer
            setTimeout(() => {
              const event = new CustomEvent('selectWomensPrayer', { detail: { prayerId: prayer.id } });
              window.dispatchEvent(event);
            }, 100);
          }
        });
      });
    }
    
    // Individual Women's Prayers - Family
    if (familyPrayers) {
      familyPrayers.forEach(prayer => {
        index.push({
          id: `womens-prayer-family-${prayer.id}`,
          category: 'Tefilla',
          title: prayer.prayerName,
          secondaryText: prayer.description || 'Family Prayer',
          keywords: ['women', 'womens', 'prayer', 'family', 'home', 'shalom', 'bayit', 'tefilla', prayer.prayerName].filter(Boolean),
          modalId: 'family',
          action: () => {
            openModal('family', 'tefilla');
            // Small delay to ensure modal is open before selecting prayer
            setTimeout(() => {
              const event = new CustomEvent('selectWomensPrayer', { detail: { prayerId: prayer.id } });
              window.dispatchEvent(event);
            }, 100);
          }
        });
      });
    }
    
    // Individual Women's Prayers - Life
    if (lifePrayers) {
      lifePrayers.forEach(prayer => {
        index.push({
          id: `womens-prayer-life-${prayer.id}`,
          category: 'Tefilla',
          title: prayer.prayerName,
          secondaryText: prayer.description || 'Life Guidance Prayer',
          keywords: ['women', 'womens', 'prayer', 'life', 'guidance', 'livelihood', 'parnassa', 'tefilla', prayer.prayerName, 'parashat', 'hamann', 'mann'].filter(Boolean),
          modalId: 'life',
          action: () => {
            openModal('life', 'tefilla');
            // Small delay to ensure modal is open before selecting prayer
            setTimeout(() => {
              const event = new CustomEvent('selectWomensPrayer', { detail: { prayerId: prayer.id } });
              window.dispatchEvent(event);
            }, 100);
          }
        });
      });
    }
    
    // Tehillim - Main modal
    index.push({
      id: 'prayer-tehillim',
      category: 'Tefilla',
      title: 'Tehillim',
      secondaryText: 'תהילים',
      keywords: ['tehillim', 'tehilim', 'תהילים', 'psalms', 'psalm', 'prayer', 'tefilla', 'tefillah', 'davening'],
      modalId: 'tehillim',
      action: () => openModal('tehillim')
    });
    
    // Individual Tehillim psalms (1-150)
    for (let i = 1; i <= 150; i++) {
      index.push({
        id: `tehillim-${i}`,
        category: 'Tehillim',
        title: `Tehillim ${i}`,
        secondaryText: `תהילים ${i}`,
        keywords: ['tehillim', 'תהילים', 'psalm', 'psalms', i.toString()],
        modalId: 'tehillim',
        action: () => {
          openModal('individual-tehillim', 'tefilla', i);
        }
      });
    }
    
    // Pirkei Avot
    if (pirkeiAvot) {
      index.push({
        id: 'pirkei-avot',
        category: 'Torah',
        title: 'Pirkei Avot',
        secondaryText: 'פרקי אבות',
        keywords: ['pirkei', 'avot', 'פרקי', 'אבות', 'ethics', 'fathers', 'mishnah', 'משנה'],
        modalId: 'pirkei-avot',
        action: () => openModal('pirkei-avot')
      });
    }
    
    // Daily Recipe - Use fullscreen event pattern
    if (recipeContent) {
      index.push({
        id: 'daily-recipe',
        category: 'Life',
        title: recipeContent.title || 'Daily Recipe',
        secondaryText: 'Recipe of the Day',
        keywords: ['recipe', 'recipes', 'cooking', 'food', 'daily', 'kitchen', 'מתכון', 'מתכונים', recipeContent.title].filter(Boolean),
        route: '/life',
        action: () => {
          // Open recipe in fullscreen using the same pattern as table section
          const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
            detail: {
              modalKey: 'recipe',
              content: recipeContent
            }
          });
          window.dispatchEvent(fullscreenEvent);
        }
      });
    }
    
    if (marriageInsight) {
      index.push({
        id: 'marriage-insights',
        category: 'Life',
        title: marriageInsight.title || 'Marriage Insights',
        secondaryText: marriageInsight.sectionNumber ? `Section ${marriageInsight.sectionNumber}` : 'Daily Marriage Wisdom',
        keywords: ['marriage', 'insights', 'wisdom', 'relationship', 'spouse', 'husband', 'wife', 'family', 'נישואין', 'משפחה', marriageInsight.title].filter(Boolean),
        route: '/life',
        action: () => {
          // Open marriage insights in fullscreen - modal will fetch fresh data
          const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
            detail: {
              modalKey: 'marriage-insights'
            }
          });
          window.dispatchEvent(fullscreenEvent);
        }
      });
    }
    
    // Note: Table Inspirations are admin-only, skipping from search
    
    // Special Women's Prayer Categories
    index.push({
      id: 'prayer-refuah',
      category: 'Personal Prayers',
      title: 'Refuah Prayers',
      secondaryText: 'Prayers for healing',
      keywords: ['refuah', 'רפואה', 'healing', 'health', 'prayer', 'women', 'personal'],
      modalId: 'refuah',
      action: () => openModal('refuah', 'tefilla')
    });
    
    index.push({
      id: 'prayer-family',
      category: 'Personal Prayers',
      title: 'Family Prayers',
      secondaryText: 'Prayers for family',
      keywords: ['family', 'משפחה', 'children', 'ילדים', 'prayer', 'women', 'personal', 'shidduch', 'שידוך', 'marriage'],
      modalId: 'family',
      action: () => openModal('family', 'tefilla')
    });
    
    index.push({
      id: 'prayer-life',
      category: 'Personal Prayers',
      title: 'Life Prayers',
      secondaryText: 'Prayers for life guidance',
      keywords: ['life', 'חיים', 'parnasa', 'parnassa', 'פרנסה', 'livelihood', 'success', 'הצלחה', 'prayer', 'women', 'personal', 'guidance'],
      modalId: 'life',
      action: () => openModal('life', 'tefilla')
    });
    
    // Additional features and tools
    const fixedItems: SearchRecord[] = [
      {
        id: 'compass',
        category: 'Tools',
        title: 'The Kotel Compass',
        secondaryText: 'Find Jerusalem for prayer',
        keywords: ['compass', 'kotel', 'כותל', 'jerusalem', 'ירושלים', 'direction', 'prayer', 'mizrach', 'מזרח'],
        action: () => {
          const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
            detail: {
              title: 'The Kotel Compass',
              contentType: 'compass'
            }
          });
          window.dispatchEvent(fullscreenEvent);
        }
      },
      {
        id: 'shabbat-times',
        category: 'Life',
        title: 'Shabbat Times',
        secondaryText: 'Candle lighting & Havdalah',
        keywords: ['shabbat', 'שבת', 'times', 'candles', 'havdalah', 'הבדלה', 'candle lighting'],
        route: '/life',
        action: () => window.location.hash = '/life'
      },
      {
        id: 'hebrew-date',
        category: 'Life',
        title: 'Hebrew Date Converter',
        secondaryText: 'Convert dates',
        keywords: ['hebrew', 'date', 'converter', 'calendar', 'לוח', 'עברי', 'jewish date'],
        action: () => openModal('date-calculator-fullscreen', 'table')
      },
      {
        id: 'donate',
        category: 'Tzedaka',
        title: 'Donate',
        secondaryText: 'Give tzedaka',
        keywords: ['donate', 'tzedaka', 'צדקה', 'charity', 'give', 'contribution'],
        route: '/donate',
        action: () => window.location.hash = '/donate'
      },
      {
        id: 'sponsor-day',
        category: 'Tzedaka',
        title: 'Sponsor a Day',
        secondaryText: 'Sponsor daily content',
        keywords: ['sponsor', 'sponsorship', 'day', 'dedication', 'לעילוי נשמת'],
        modalId: 'sponsor-details',
        action: () => openModal('sponsor-details', 'tzedaka')
      }
    ];
    
    const finalIndex = [...index, ...fixedItems];
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[SearchContext] Search index built:', finalIndex.length, 'items');
      console.log('[SearchContext] Torah data:', { 
        hasHalacha: !!halachaContent,
        hasChizuk: !!chizukContent,
        hasEmuna: !!emunaContent
      });
    }
    
    return finalIndex;
  }, [halachaContent, chizukContent, emunaContent, minchaPrayers, maarivPrayers, morningPrayers, dailyBrochas, specialBrochas, recipeContent, marriageInsight, pirkeiAvot, refuahPrayers, familyPrayers, lifePrayers, openModal]);
  
  // Build MiniSearch index for fuzzy matching with enhanced error handling
  const miniSearchIndex = useMemo(() => {
    try {
      if (searchIndex.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SearchContext] Search index is empty, skipping MiniSearch creation');
        }
        return null;
      }
      
      const index = createSearchIndex(searchIndex);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SearchContext] MiniSearch index created successfully with', searchIndex.length, 'records');
      }
      
      return index;
    } catch (error) {
      console.error('[SearchContext] Failed to create MiniSearch index:', error);
      // Log the error details for debugging
      if (error instanceof Error) {
        console.error('[SearchContext] Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      return null; // Gracefully degrade - search will use simple fallback
    }
  }, [searchIndex]);
  
  const isLoading = false; // We're using cached data, so no loading state needed
  
  return (
    <SearchContext.Provider value={{ searchIndex, miniSearchIndex, isLoading }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}
