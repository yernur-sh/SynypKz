import ParentPortal from '@/components/parent-portal/ParentPortal';
import RouteGuard from '@/components/layout/RouteGuard';

export default function ParentPortalPage() {
  return (
    <RouteGuard>
      <ParentPortal />
    </RouteGuard>
  );
}
