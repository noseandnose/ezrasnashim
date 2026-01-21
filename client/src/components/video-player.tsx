import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export default function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const [videoStarted, setVideoStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (videoStarted && iframeRef.current) {
      const iframe = iframeRef.current;
      setTimeout(() => {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen().catch(() => {});
        } else if ((iframe as any).webkitRequestFullscreen) {
          (iframe as any).webkitRequestFullscreen();
        } else if ((iframe as any).webkitEnterFullscreen) {
          (iframe as any).webkitEnterFullscreen();
        }
      }, 100);
    }
  }, [videoStarted]);

  return (
    <div className="rounded-xl overflow-hidden aspect-video relative bg-black">
      {!videoStarted ? (
        <button
          onClick={() => setVideoStarted(true)}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/20 to-black/40 hover:from-black/30 hover:to-black/50 transition-all group"
          aria-label={`Play ${title || 'video'}`}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-10 h-10 text-blush ml-1" fill="currentColor" />
          </div>
        </button>
      ) : (
        <iframe
          ref={iframeRef}
          src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={title || 'Video player'}
        />
      )}
    </div>
  );
}
