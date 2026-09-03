import { redirect } from 'next/navigation';

interface ReceiptRouteProps {
  params: { receiptId: string; receiptNumber: string };
}

export default function CanonicalReceiptRoute({ params }: ReceiptRouteProps) {
  redirect(`/r/${encodeURIComponent(params.receiptNumber)}?mandal=${encodeURIComponent(params.receiptId)}`);
}
