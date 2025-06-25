import { useQuery } from "@tanstack/react-query";

interface SponsorshipBarProps {
  className?: string;
}

interface Sponsor {
  id: number;
  name: string;
  hebrewName?: string;
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
      const response = await fetch(`fetch(`${import.meta.env.VITE_API_URL}/api//api/sponsors/daily/${today}`);
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
    <div className={`bg-gradient-to-r from-blush/10 to-lavender/10 border border-blush/20 rounded-3xl p-4 text-center ${className}`}>
      <div className="font-sans text-sm font-medium text-warm-gray">
        {customMessage ? (
          <span>{customMessage}</span>
        ) : (
          <span>
            Today's learning has been sponsored by{' '}
            <span className="font-serif font-semibold text-blush">
              {sponsorName}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}