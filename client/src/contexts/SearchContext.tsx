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
  const { data: prayers } = useQuery<any[]>({ queryKey: ['/api/prayers'] });
  const { data: recipes } = useQuery<any[]>({ queryKey: ['/api/daily-recipes'] });
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
    if (prayers && Array.isArray(prayers)) {
      const prayerData = [
        { id: 'morning-brochas', english: 'Morning Brochas', hebrew: 'ברכות השחר', keywords: ['morning', 'blessings', 'brochas', 'ברכות', 'shacharit', 'שחרית'] },
        { id: 'mincha', english: 'Mincha', hebrew: 'מנחה', keywords: ['mincha', 'מנחה', 'afternoon', 'prayer'] },
        { id: 'maariv', english: 'Maariv', hebrew: 'מעריב', keywords: ['maariv', 'מעריב', 'evening', 'prayer', 'night'] },
        { id: 'nishmas', english: 'Nishmas', hebrew: 'נשמת', keywords: ['nishmas', 'נשמת', 'shabbat', 'שבת', 'prayer'] },
        { id: 'tehillim', english: 'Tehillim', hebrew: 'תהילים', keywords: ['tehillim', 'תהילים', 'psalms', 'prayer'] },
        { id: 'birkat-hamazon', english: 'Birkat Hamazon', hebrew: 'ברכת המזון', keywords: ['birkat', 'hamazon', 'ברכת', 'המזון', 'grace', 'after', 'meals', 'bentching'] },
      ];
      
      prayerData.forEach(prayer => {
        index.push({
          id: `prayer-${prayer.id}`,
          category: 'Tefilla',
          title: prayer.english,
          secondaryText: prayer.hebrew,
          keywords: prayer.keywords,
          modalId: prayer.id,
          action: () => openModal(prayer.id as any)
        });
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
    
    // Daily Recipe
    if (recipes && recipes.length > 0) {
      const todayRecipe = recipes[0];
      index.push({
        id: 'daily-recipe',
        category: 'Life',
        title: todayRecipe.title || 'Daily Recipe',
        secondaryText: 'Recipe of the Day',
        keywords: ['recipe', 'cooking', 'food', 'daily', 'kitchen', 'מתכון'],
        route: '/life',
        action: () => window.location.hash = '/life'
      });
    }
    
    // Table Inspirations
    if (tableInspirations && tableInspirations.length > 0) {
      index.push({
        id: 'table-inspirations',
        category: 'Life',
        title: 'Table Inspirations',
        secondaryText: 'Shabbat & Yom Tov ideas',
        keywords: ['table', 'shabbat', 'שבת', 'yom tov', 'inspiration', 'ideas'],
        route: '/life',
        action: () => window.location.hash = '/life'
      });
    }
    
    // Fixed navigation items
    const fixedItems: SearchRecord[] = [
      {
        id: 'compass',
        category: 'Tools',
        title: 'The Kotel Compass',
        secondaryText: 'Find Jerusalem',
        keywords: ['compass', 'kotel', 'כותל', 'jerusalem', 'ירושלים', 'direction', 'prayer'],
        route: '/compass',
        action: () => window.location.hash = '/compass'
      },
      {
        id: 'shabbat-times',
        category: 'Life',
        title: 'Shabbat Times',
        secondaryText: 'Candle lighting & Havdalah',
        keywords: ['shabbat', 'שבת', 'times', 'candles', 'havdalah', 'הבדלה'],
        route: '/life',
        action: () => window.location.hash = '/life'
      },
      {
        id: 'hebrew-date',
        category: 'Life',
        title: 'Hebrew Date Converter',
        secondaryText: 'Convert dates',
        keywords: ['hebrew', 'date', 'converter', 'calendar', 'לוח', 'עברי'],
        route: '/life',
        action: () => window.location.hash = '/life'
      }
    ];
    
    return [...index, ...fixedItems];
  }, [dailyTorah, prayers, recipes, tableInspirations, pirkeiAvot, openModal]);
  
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
