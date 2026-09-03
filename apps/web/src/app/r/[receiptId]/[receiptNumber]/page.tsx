import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ReceiptRouteProps {
  params: { receiptId: string; receiptNumber: string };
}

export default function CanonicalReceiptRoute({ params }: ReceiptRouteProps) {
  redirect(`/r/${encodeURIComponent(params.receiptNumber)}?mandal=${encodeURIComponent(params.receiptId)}`);
}
