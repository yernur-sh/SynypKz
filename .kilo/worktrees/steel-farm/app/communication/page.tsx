import CommunicationHub from '@/components/communication/CommunicationHub';
import RouteGuard from '@/components/layout/RouteGuard';

export default function CommunicationPage() {
  return (
    <RouteGuard>
      <CommunicationHub />
    </RouteGuard>
  );
}
