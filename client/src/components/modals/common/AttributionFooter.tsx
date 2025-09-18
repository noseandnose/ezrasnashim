import { BookOpen } from "lucide-react";

interface AttributionFooterProps {
  type: 'koren' | 'nishmas' | 'chuppah' | 'custom';
  customTitle?: string;
  customMessage?: string;
  customLink?: string;
}

const attributionData = {
  koren: {
    title: 'Special Thanks',
    message: 'Text courtesy of Koren Publishers Jerusalem, the preeminent publisher of Hebrew prayer books.',
    link: 'https://korenpub.com'
  },
  nishmas: {
    title: 'Special Thanks',
    message: 'Content provided courtesy of Nishmas Organization.',
    link: 'https://nishmas.org'
  },
  chuppah: {
    title: 'Mazel Tov!',
    message: 'Content courtesy of The Chuppah Organization.',
    link: 'https://chuppah.org'
  }
};

export function AttributionFooter({ type, customTitle, customMessage, customLink }: AttributionFooterProps) {
  const data = type === 'custom' 
    ? { title: customTitle || 'Special Thanks', message: customMessage || '', link: customLink || '' }
    : attributionData[type];

  if (!data.message) return null;

  return (
    <div className="bg-gradient-to-r from-blush/10 to-lavender/10 rounded-2xl p-4 border border-blush/20">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-4 w-4 text-blush" />
        <span className="text-sm platypi-bold text-black">{data.title}</span>
      </div>
      <div className="text-sm platypi-regular text-black leading-relaxed">
        {data.message}
        {data.link && (
          <>
            {' '}
            <a 
              href={data.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blush underline hover:text-blush/80 transition-colors"
            >
              Visit Website
            </a>
          </>
        )}
      </div>
    </div>
  );
}