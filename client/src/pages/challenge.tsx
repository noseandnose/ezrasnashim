import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Sparkles, Calendar } from "lucide-react";
import { formatTextContent } from "@/lib/text-formatter";
import type { TodaysSpecial } from "@shared/schema";

type ChallengeWithExpiry = TodaysSpecial & { isExpired: boolean };

const formatDateRange = (from: string, until: string) => {
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  const f = new Date(from + "T00:00:00").toLocaleDateString("en-US", opts);
  const u = new Date(until + "T00:00:00").toLocaleDateString("en-US", opts);
  return from === until ? f : `${f} – ${u}`;
};

export default function ChallengePage() {
  const [, params] = useRoute("/challenge/:id");
  const [, setLocation] = useLocation();
  const id = params?.id || "";

  const { data: challenge, isLoading, error } = useQuery<ChallengeWithExpiry>({
    queryKey: ["/api/challenge", id],
    queryFn: async () => {
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/api/challenge/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="animate-spin w-8 h-8 border-4 border-blush border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-6">
        <div className="w-16 h-16 rounded-full bg-blush/10 flex items-center justify-center mb-4">
          <Sparkles size={28} className="text-blush" />
        </div>
        <h1 className="platypi-bold text-2xl text-black mb-2">Challenge Not Found</h1>
        <p className="platypi-regular text-black/60 text-center mb-6">
          This community challenge doesn't exist or may have been removed.
        </p>
        <button
          onClick={() => setLocation("/")}
          className="bg-gradient-feminine text-white rounded-full px-6 py-3 platypi-medium"
        >
          Go to Ezras Nashim
        </button>
      </div>
    );
  }

  const progress =
    challenge.targetCount && challenge.currentCount !== null
      ? Math.min(100, Math.round(((challenge.currentCount ?? 0) / challenge.targetCount) * 100))
      : null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50 overflow-hidden">
      <div className="flex items-center p-4 border-b border-blush/10 bg-white safe-area-top">
        <button
          onClick={() => setLocation("/")}
          className="p-2 rounded-full hover:bg-blush/10 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={24} className="text-black" />
        </button>
        <div className="flex-1 text-center px-2">
          <h1 className="platypi-bold text-lg text-black truncate">Community Challenge</h1>
        </div>
        <div className="w-10 flex-shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {challenge.imageUrl && (
            <div className="rounded-2xl overflow-hidden">
              <img
                src={challenge.imageUrl}
                alt={challenge.title}
                className="w-full object-cover max-h-52"
              />
            </div>
          )}

          <div className="py-3 px-4 border border-blush/20 rounded-xl bg-white space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-blush flex-shrink-0" />
              <p className="platypi-medium text-sm text-black/60">Today's Special</p>
              {challenge.isExpired && (
                <span className="ml-auto text-xs platypi-regular text-black/40 bg-black/5 rounded-full px-2 py-0.5">
                  Ended
                </span>
              )}
            </div>
            <p className="platypi-bold text-lg text-black leading-snug">{challenge.title}</p>
            {challenge.subtitle && (
              <p className="platypi-regular text-sm text-black/70">{challenge.subtitle}</p>
            )}
            <div className="flex items-center gap-1.5 pt-1">
              <Calendar size={12} className="text-black/40" />
              <p className="platypi-regular text-xs text-black/40">
                {formatDateRange(challenge.fromDate, challenge.untilDate)}
              </p>
            </div>
          </div>

          {challenge.isExpired && (
            <div className="bg-black/5 rounded-xl px-4 py-3">
              <p className="platypi-regular text-sm text-black/60 text-center">
                This challenge has ended. Open Ezras Nashim to see today's active challenge.
              </p>
            </div>
          )}

          {progress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="platypi-bold text-black/60">Community Progress</span>
                <span className="platypi-bold text-black">{progress}%</span>
              </div>
              <div className="h-5 bg-gradient-feminine rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-sage rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="platypi-regular text-xs text-black/50 text-right">
                {challenge.currentCount?.toLocaleString()} of {challenge.targetCount?.toLocaleString()} completions
              </p>
            </div>
          )}

          {challenge.challengeMessage && (
            <div className="bg-blush/10 rounded-xl px-4 py-3">
              <p
                className="platypi-regular text-sm text-black/80 text-center"
                dangerouslySetInnerHTML={{ __html: formatTextContent(challenge.challengeMessage) }}
              />
            </div>
          )}

          {challenge.contentEnglish && (
            <div className="bg-white rounded-2xl p-5 border border-blush/10">
              <div
                className="platypi-regular text-sm text-black leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatTextContent(challenge.contentEnglish) }}
              />
            </div>
          )}

          {challenge.contentHebrew && (
            <div className="bg-white rounded-2xl p-5 border border-blush/10">
              <div
                className="vc-koren-hebrew text-base text-black leading-relaxed text-right"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: formatTextContent(challenge.contentHebrew) }}
              />
            </div>
          )}

          {challenge.url && challenge.linkTitle && (
            <a
              href={challenge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-gradient-feminine text-white rounded-full py-3 platypi-medium text-sm"
            >
              {challenge.linkTitle}
            </a>
          )}

          <button
            onClick={() => setLocation("/")}
            className="block w-full text-center border border-blush/30 text-black rounded-full py-3 platypi-medium text-sm"
          >
            Open Ezras Nashim
          </button>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
