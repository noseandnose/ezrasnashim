import { useQuery } from "@tanstack/react-query";

interface SponsorshipBarProps {
  contentType: 'halacha' | 'mussar' | 'chizuk' | 'loshon';
}

interface Sponsor {
  id: number;
  name: string;
  hebrewName?: string;
  contentType: string;
  sponsorshipDate: string;
  message?: string;
  isActive: boolean;
  createdAt: string;
}

export default function SponsorshipBar({ contentType }: SponsorshipBarProps) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { data: sponsor, isLoading } = useQuery<Sponsor | null>({
    queryKey: ['sponsor', contentType, today],
    queryFn: async () => {
      const response = await fetch(`/api/sponsors/${contentType}/${today}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  if (isLoading || !sponsor) {
    return null;
  }

  const sponsorName = sponsor.hebrewName || sponsor.name;
  const customMessage = sponsor.message;

  return (
    <div className="bg-gradient-to-r from-pink-50 to-peach-50 dark:from-pink-900/20 dark:to-peach-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-3 mb-4 text-center">
      <div className="text-sm font-medium text-pink-800 dark:text-pink-200">
        {customMessage ? (
          <span>{customMessage}</span>
        ) : (
          <span>
            Today's learning has been sponsored by{' '}
            <span className="font-semibold text-pink-900 dark:text-pink-100">
              {sponsorName}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}