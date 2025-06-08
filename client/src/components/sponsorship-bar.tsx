import { useQuery } from "@tanstack/react-query";

interface SponsorshipBarProps {
  className?: string;
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

export default function SponsorshipBar({ className = "" }: SponsorshipBarProps) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { data: sponsor, isLoading } = useQuery<Sponsor | null>({
    queryKey: ['daily-sponsor', today],
    queryFn: async () => {
      const response = await fetch(`/api/sponsors/daily/${today}`);
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
    <div className={`bg-gradient-to-r from-pink-50 to-peach-50 dark:from-pink-900/20 dark:to-peach-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-3 text-center ${className}`}>
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