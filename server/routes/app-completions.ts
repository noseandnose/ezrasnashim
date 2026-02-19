import { supabase } from '../supabase-auth';

const CONTENT_TYPE_MAP: Record<string, string> = {
  daily_chizuk: 'chizuk',
  daily_emuna: 'emuna',
  daily_halacha: 'halacha',
  pirkei_avos: 'pirkei-avot',
  gems_of_gratitude: 'gems-of-gratitude',
  shalom_content: 'shalom',
  shmiras_halashon: 'shmiras-halashon',
  torah_challenges: 'torah-challenge',
  parsha_vort: 'parsha-vort',
  featured: 'featured',
  library: 'library',
  tehillim: 'chain-tehillim',
  nishmas: 'nishmas-campaign',
  brocha: 'brocha',
  morning_brochas: 'morning-brochas',
  shacharis: 'shacharis',
  mincha: 'mincha',
  maariv: 'maariv',
  special_tefillas: 'womens-prayer',
  recipe: 'recipe',
  marriage_insights: 'marriage-insights',
  inspiration: 'inspiration',
  gift_of_chatzos: 'gift-of-chatzos',
  life_class: 'life-class',
  meditation: 'meditation',
  gave_elsewhere: 'tzedaka',
  parenting: 'life-class',
};

interface AppCompletionStats {
  totalActs: number;
  tzedakaActs: number;
  tehillimCompleted: number;
  meditationsCompleted: number;
  modalCompletions: Record<string, number>;
}

export async function getAppCompletionsForPeriod(
  startDate: string,
  endDate?: string
): Promise<AppCompletionStats> {
  const result: AppCompletionStats = {
    totalActs: 0,
    tzedakaActs: 0,
    tehillimCompleted: 0,
    meditationsCompleted: 0,
    modalCompletions: {},
  };

  if (!supabase) return result;

  try {
    let query = supabase
      .from('app_mitzvah_completions')
      .select('category, content_type')
      .gte('created_at', `${startDate}T00:00:00`);

    if (endDate) {
      query = query.lt('created_at', `${endDate}T00:00:00`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error querying app_mitzvah_completions:', error);
      return result;
    }

    if (!data || data.length === 0) return result;

    result.totalActs = data.length;

    for (const row of data) {
      if (row.category === 'Tzedaka') {
        result.tzedakaActs++;
      }

      if (row.content_type === 'tehillim') {
        result.tehillimCompleted++;
      }

      if (row.content_type === 'meditation') {
        result.meditationsCompleted++;
      }

      const mappedKey = CONTENT_TYPE_MAP[row.content_type];
      if (mappedKey) {
        result.modalCompletions[mappedKey] = (result.modalCompletions[mappedKey] || 0) + 1;
      }
    }

    return result;
  } catch (err) {
    console.error('Error fetching app completions:', err);
    return result;
  }
}

export function mergeAppCompletions(
  webStats: {
    totalActs: number;
    tzedakaActs: number;
    tehillimCompleted?: number;
    meditationsCompleted?: number;
    modalCompletions?: Record<string, number>;
    totalTzedakaActs?: number;
    totalTehillimCompleted?: number;
    totalMeditationsCompleted?: number;
    totalModalCompletions?: Record<string, number>;
  },
  appStats: AppCompletionStats
): void {
  if ('totalActs' in webStats) {
    webStats.totalActs = (webStats.totalActs || 0) + appStats.totalActs;
  }

  if ('tzedakaActs' in webStats) {
    webStats.tzedakaActs = (webStats.tzedakaActs || 0) + appStats.tzedakaActs;
  }
  if ('totalTzedakaActs' in webStats) {
    webStats.totalTzedakaActs = (webStats.totalTzedakaActs || 0) + appStats.tzedakaActs;
  }

  if ('tehillimCompleted' in webStats) {
    webStats.tehillimCompleted = (webStats.tehillimCompleted || 0) + appStats.tehillimCompleted;
  }
  if ('totalTehillimCompleted' in webStats) {
    webStats.totalTehillimCompleted = (webStats.totalTehillimCompleted || 0) + appStats.tehillimCompleted;
  }

  if ('meditationsCompleted' in webStats) {
    webStats.meditationsCompleted = (webStats.meditationsCompleted || 0) + appStats.meditationsCompleted;
  }
  if ('totalMeditationsCompleted' in webStats) {
    webStats.totalMeditationsCompleted = (webStats.totalMeditationsCompleted || 0) + appStats.meditationsCompleted;
  }

  const targetCompletions = webStats.modalCompletions || webStats.totalModalCompletions;
  if (targetCompletions) {
    for (const [key, count] of Object.entries(appStats.modalCompletions)) {
      targetCompletions[key] = (targetCompletions[key] || 0) + count;
    }
  }
}
