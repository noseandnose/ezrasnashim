// Sefaria API integration for Tehillim
export interface SefariaResponse {
  text: string[];
  he: string[];
  ref?: string;
  versions?: any[];
}

export async function fetchTehillimFromSefaria(
  perekNumber: number, 
  language: 'hebrew' | 'english' = 'hebrew'
): Promise<string> {
  const languageParam = language === 'hebrew' ? 'hebrew' : 'english';
  const url = `https://www.sefaria.org/api/v3/texts/Psalms.${perekNumber}?version=${languageParam}&return_format=text_only`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }
    
    const data: SefariaResponse = await response.json();
    
    // Extract text from the response
    const textArray = language === 'hebrew' ? data.he : data.text;
    
    if (!textArray || textArray.length === 0) {
      throw new Error('No text found in Sefaria response');
    }
    
    // Join the text array into a single string with proper formatting
    return textArray.join('\n');
  } catch (error) {
    console.error('Failed to fetch Tehillim from Sefaria:', error);
    throw new Error(`Failed to load Perek ${perekNumber} from Sefaria`);
  }
}

// Helper function to get both Hebrew and English text simultaneously
export async function fetchTehillimBothLanguages(perekNumber: number): Promise<{
  hebrew: string;
  english: string;
}> {
  try {
    const [hebrewText, englishText] = await Promise.all([
      fetchTehillimFromSefaria(perekNumber, 'hebrew'),
      fetchTehillimFromSefaria(perekNumber, 'english')
    ]);
    
    return {
      hebrew: hebrewText,
      english: englishText
    };
  } catch (error) {
    console.error('Failed to fetch Tehillim in both languages:', error);
    throw error;
  }
}