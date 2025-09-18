import { StandardModal } from './common/StandardModal';
import { useModalStore } from "@/lib/types";

// Consolidated component for simple content modals that just display information
// This replaces individual modal components that had nearly identical structure

export function SimpleContentModals() {
  const { activeModal, closeModal } = useModalStore();

  // About Modal
  if (activeModal === 'about') {
    return (
      <StandardModal
        isOpen={true}
        onClose={closeModal}
        title="About Ezras Nashim"
        description="Your spiritual companion for daily Jewish living"
        width="md"
        className="bg-gradient-to-br from-blush to-lavender border-0 shadow-2xl"
      >
        <div className="space-y-4">
          <div className="bg-white/80 rounded-2xl p-4">
            <p className="text-sm platypi-regular text-black leading-relaxed">
              Ezras Nashim is your daily spiritual companion, helping Jewish women engage with Torah, Tefilla, and Tzedaka through meaningful daily activities.
            </p>
          </div>
          <div className="bg-white/60 rounded-2xl p-4">
            <p className="text-xs platypi-regular text-black/80">
              "On three things the world stands: on the Torah, on divine worship (prayer), and on acts of loving-kindness." - Pirkei Avot 1:2
            </p>
          </div>
        </div>
      </StandardModal>
    );
  }

  // Community Impact Modal 
  if (activeModal === 'community-impact') {
    return (
      <StandardModal
        isOpen={true}
        onClose={closeModal}
        title="Community Impact"
        description="See how Ezras Nashim strengthens our community"
        width="md"
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blush/10 to-lavender/10 rounded-2xl p-4 border border-blush/20">
            <h3 className="platypi-bold text-base text-black mb-2">Daily Spiritual Growth</h3>
            <p className="text-sm platypi-regular text-black/80 leading-relaxed">
              Thousands of women strengthen their connection to Jewish life through daily Torah, Tefilla, and Tzedaka activities.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-sage/10 to-blush/10 rounded-2xl p-4 border border-sage/20">
            <h3 className="platypi-bold text-base text-black mb-2">Community Support</h3>
            <p className="text-sm platypi-regular text-black/80 leading-relaxed">
              Our tzedaka initiatives provide meaningful support for fertility assistance, abuse prevention, and Torah learning.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-lavender/10 to-muted-lavender/10 rounded-2xl p-4 border border-lavender/20">
            <h3 className="platypi-bold text-base text-black mb-2">Spiritual Connection</h3>
            <p className="text-sm platypi-regular text-black/80 leading-relaxed">
              Connecting Jewish women worldwide through shared mitzvah completion and daily spiritual practice.
            </p>
          </div>
        </div>
      </StandardModal>
    );
  }

  // Sponsor Details Modal (if no sponsor data, show loading/empty state)
  if (activeModal === 'sponsor-details') {
    return (
      <StandardModal
        isOpen={true}
        onClose={closeModal}
        title="Today's Sponsor"
        width="md"
      >
        <div className="text-center py-8">
          <p className="text-sm platypi-regular text-black/60">
            No sponsor information available for today.
          </p>
        </div>
      </StandardModal>
    );
  }

  return null;
}