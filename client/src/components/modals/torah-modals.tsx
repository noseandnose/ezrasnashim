import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";

export default function TorahModals() {
  const { activeModal, closeModal } = useModalStore();

  const { data: content = [], isLoading } = useQuery({
    queryKey: ['/api/content/halacha'],
    enabled: activeModal === 'halacha'
  });

  const { data: mussarContent = [], isLoading: mussarLoading } = useQuery({
    queryKey: ['/api/content/mussar'],
    enabled: activeModal === 'mussar'
  });

  const { data: chizukContent = [], isLoading: chizukLoading } = useQuery({
    queryKey: ['/api/content/chizuk'],
    enabled: activeModal === 'chizuk'
  });

  const { data: loshonContent = [], isLoading: loshonLoading } = useQuery({
    queryKey: ['/api/content/loshon'],
    enabled: activeModal === 'loshon'
  });

  return (
    <>
      {/* Halacha Modal */}
      <Dialog open={activeModal === 'halacha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto modal-content rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Daily Halacha</DialogTitle>
            <p className="text-sm text-gray-600">Laws of Chanukah - Day 3</p>
          </DialogHeader>
          
          {isLoading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="space-y-3 text-sm text-gray-700">
              {content && content[0] && (
                <div>
                  <p><strong>Today's Halacha:</strong> {content[0].content}</p>
                  <p className="mt-2"><strong>Additional Guidelines:</strong> Candles should be lit immediately after sunset, and should burn for at least 30 minutes.</p>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Mussar Modal */}
      <Dialog open={activeModal === 'mussar'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Daily Mussar</DialogTitle>
          </DialogHeader>
          
          {mussarLoading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="text-center text-gray-600">
              {mussarContent && mussarContent[0] ? mussarContent[0].content : "Today's lesson on building character and spiritual growth..."}
            </div>
          )}

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Chizuk Audio Modal */}
      <Dialog open={activeModal === 'chizuk'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold mb-2">Daily Chizuk</DialogTitle>
            <p className="text-sm text-gray-600 mb-4">
              {chizukContent && chizukContent[0] ? chizukContent[0].title : "Finding Light in Darkness"}
            </p>
          </DialogHeader>
          
          <AudioPlayer 
            title={chizukContent && chizukContent[0] ? chizukContent[0].title : "Finding Light in Darkness"}
            duration="5:23"
            audioUrl={chizukContent && chizukContent[0] ? chizukContent[0].audioUrl || "" : ""}
          />

          <Button 
            onClick={() => closeModal()} 
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-medium mt-4"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Loshon Horah Modal */}
      <Dialog open={activeModal === 'loshon'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Loshon Horah</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            {loshonLoading ? "Loading..." : 
             loshonContent && loshonContent[0] ? loshonContent[0].content : 
             "Daily reminder about the importance of guarding our speech..."}
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
