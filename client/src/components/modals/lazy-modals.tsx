import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load modal components for better performance
export const LazyTorahModals = lazy(() => import('./torah-modals'));
export const LazyTefillaModals = lazy(() => import('./tefilla-modals'));
export const LazyTimesModals = lazy(() => import('./times-modals'));
export const LazyTableModals = lazy(() => import('./table-modals'));

// Loading component for suspense fallback
const ModalLoader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="animate-spin text-blush" size={32} />
  </div>
);

// Wrapper components with suspense
export const TorahModalsWrapper = () => (
  <Suspense fallback={<ModalLoader />}>
    <LazyTorahModals />
  </Suspense>
);

export const TefillaModalsWrapper = () => (
  <Suspense fallback={<ModalLoader />}>
    <LazyTefillaModals />
  </Suspense>
);

export const TimesModalsWrapper = () => (
  <Suspense fallback={<ModalLoader />}>
    <LazyTimesModals />
  </Suspense>
);

export const TableModalsWrapper = () => (
  <Suspense fallback={<ModalLoader />}>
    <LazyTableModals />
  </Suspense>
);