import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchRecord } from '@/lib/searchUtils';
import { useModalStore } from '@/lib/types';

interface SearchContextValue {
  searchIndex: SearchRecord[];
  isLoading: boolean;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const { openModal } = useModalStore();
  
  // Get data from existing queries
  const { data: dailyTorah } = useQuery<any>({ queryKey: ['/api/daily-torah'] });
  const { data: minchaPrayers } = useQuery<any[]>({ queryKey: ['/api/mincha/prayers'] });
  const { data: maarivPrayers } = useQuery<any[]>({ queryKey: ['/api/maariv/prayers'] });
  const { data: morningPrayers } = useQuery<any[]>({ queryKey: ['/api/morning/prayers'] });
  const { data: womensPrayers } = useQuery<any[]>({ queryKey: ['/api/womens/prayers'] });
  const { data: dailyBrochas } = useQuery<any[]>({ queryKey: ['/api/brochas/daily'] });
  const { data: specialBrochas } = useQuery<any[]>({ queryKey: ['/api/brochas/special'] });
  const { data: recipeContent } = useQuery<any>({ queryKey: ['/api/table/recipe'] });
  const { data: tableInspirations } = useQuery<any[]>({ queryKey: ['/api/table-inspirations'] });
  const { data: pirkeiAvot } = useQuery<any>({ queryKey: ['/api/pirkei-avot'] });
  
  const searchIndex = useMemo(() => {
    const index: SearchRecord[] = [];
    
    // Daily Torah Content
    if (dailyTorah) {
      if (dailyTorah.halacha) {
        index.push({
          id: 'torah-halacha',
          category: 'Torah',
          title: dailyTorah.halacha.englishTitle || 'Daily Halacha',
          secondaryText: dailyTorah.halacha.hebrewTitle,
          keywords: ['halacha', 'הלכה', 'law', 'torah', 'תורה', 'daily'],
          modalId: 'halacha',
          action: () => openModal('halacha')
        });
      }
      
      if (dailyTorah.chizuk) {
        index.push({
          id: 'torah-chizuk',
          category: 'Torah',
          title: dailyTorah.chizuk.englishTitle || 'Daily Chizuk',
          secondaryText: dailyTorah.chizuk.hebrewTitle,
          keywords: ['chizuk', 'חיזוק', 'inspiration', 'torah', 'תורה', 'daily'],
          modalId: 'chizuk',
          action: () => openModal('chizuk')
        });
      }
      
      if (dailyTorah.emuna) {
        index.push({
          id: 'torah-emuna',
          category: 'Torah',
          title: dailyTorah.emuna.englishTitle || 'Daily Emuna',
          secondaryText: dailyTorah.emuna.hebrewTitle,
          keywords: ['emuna', 'אמונה', 'faith', 'torah', 'תורה', 'daily'],
          modalId: 'emuna',
          action: () => openModal('emuna')
        });
      }
    }
    
    // Prayers
    // Mincha
    index.push({
      id: 'prayer-mincha',
      category: 'Tefilla',
      title: 'Mincha',
      secondaryText: 'מנחה',
      keywords: ['mincha', 'מנחה', 'afternoon', 'prayer', 'tefilla'],
      modalId: 'mincha',
      action: () => openModal('mincha')
    });
    
    // Maariv
    index.push({
      id: 'prayer-maariv',
      category: 'Tefilla',
      title: 'Maariv',
      secondaryText: 'מעריב',
      keywords: ['maariv', 'מעריב', 'evening', 'prayer', 'night', 'tefilla'],
      modalId: 'maariv',
      action: () => openModal('maariv')
    });
    
    // Morning Brochas - Main modal
    index.push({
      id: 'prayer-morning-brochas',
      category: 'Tefilla',
      title: 'Morning Brochas',
      secondaryText: 'ברכות השחר',
      keywords: ['morning', 'brochas', 'blessings', 'ברכות', 'השחר', 'shacharit', 'שחרית', 'tefilla'],
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
      keywords: ['nishmas', 'נשמת', 'shabbat', 'שבת', 'prayer', 'tefilla'],
      modalId: 'nishmas',
      action: () => openModal('nishmas')
    });
    
    // Women's Prayers - Main modal
    index.push({
      id: 'prayer-womens',
      category: 'Tefilla',
      title: "Women's Prayers",
      secondaryText: 'תפילות לנשים',
      keywords: ['women', 'womens', 'prayer', 'prayers', 'tefilla', 'nashim', 'נשים', 'תפילות'],
      modalId: 'womens-prayers',
      action: () => openModal('womens-prayers')
    });
    
    // Individual Women's Prayers
    if (womensPrayers && Array.isArray(womensPrayers)) {
      womensPrayers.forEach((prayer: any, idx: number) => {
        const title = prayer.englishTitle || prayer.hebrewTitle || `Women's Prayer ${idx + 1}`;
        const secondary = prayer.hebrewTitle || prayer.englishTitle;
        index.push({
          id: `womens-prayer-${idx}`,
          category: 'Personal Prayers',
          title: title,
          secondaryText: secondary,
          keywords: ['women', 'prayer', 'womens', 'tefilla', 'nashim', 'נשים', 'personal', title, secondary].filter(Boolean),
          modalId: 'womens-prayers',
          action: () => openModal('womens-prayers')
        });
      });
    }
    
    // Tehillim - Main modal
    index.push({
      id: 'prayer-tehillim',
      category: 'Tefilla',
      title: 'Tehillim',
      secondaryText: 'תהילים',
      keywords: ['tehillim', 'תהילים', 'psalms', 'prayer', 'tefilla'],
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
    
    // Table Inspirations
    index.push({
      id: 'table-inspirations-category',
      category: 'Life',
      title: 'Table Inspirations',
      secondaryText: 'Shabbat & Yom Tov ideas',
      keywords: ['table', 'shabbat', 'שבת', 'yom tov', 'inspiration', 'ideas'],
      route: '/life',
      action: () => window.location.hash = '/life'
    });
    
    if (tableInspirations && Array.isArray(tableInspirations) && tableInspirations.length > 0) {
      tableInspirations.forEach((inspiration: any, idx: number) => {
        const title = inspiration.title || `Inspiration ${idx + 1}`;
        index.push({
          id: `inspiration-${inspiration.id || idx}`,
          category: 'Life',
          title: title,
          secondaryText: 'Shabbat table idea',
          keywords: ['table', 'inspiration', 'shabbat', 'שבת', title].filter(Boolean),
          route: '/life',
          action: () => window.location.hash = '/life'
        });
      });
    }
    
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
    
    return [...index, ...fixedItems];
  }, [dailyTorah, minchaPrayers, maarivPrayers, morningPrayers, womensPrayers, dailyBrochas, specialBrochas, recipeContent, tableInspirations, pirkeiAvot, openModal]);
  
  const isLoading = false; // We're using cached data, so no loading state needed
  
  return (
    <SearchContext.Provider value={{ searchIndex, isLoading }}>
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
