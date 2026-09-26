import FunBreak from '@/components/fun-break/FunBreak';
import RouteGuard from '@/components/layout/RouteGuard';

export default function FunBreakPage() {
  return (
    <RouteGuard>
      <FunBreak />
    </RouteGuard>
  );
}
