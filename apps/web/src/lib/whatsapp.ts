import { Language, PaymentMode } from '@vargani/types';
import { numberToWordsIndian } from './receipt-generator';
import { buildWhatsAppReceiptLink, buildWhatsAppShareLink, getWhatsAppReceiptMessage } from './whatsapp-templates';

export interface WhatsAppReceiptParams {
  donorPhone?: string;
  donorName: string;
  mandalName: string;
  mandalSlug?: string;
  receiptNumber: string;
  amount: number;
  paymentMode: PaymentMode;
  date: string;
  language?: Language;
  appUrl?: string;
}

export function generateWhatsAppShareUrl(params: WhatsAppReceiptParams): string {
  const origin = params.appUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://digitalvargani.in');
  const verifyUrl = `${origin}/r/${params.receiptNumber}`;
  const amountWords = numberToWordsIndian(params.amount, params.language || Language.MARATHI);

  return buildWhatsAppReceiptLink({
    donorPhone: params.donorPhone,
    donorName: params.donorName,
    mandalName: params.mandalName,
    receiptNumber: params.receiptNumber,
    amount: params.amount,
    amountInWords: amountWords,
    receiptUrl: verifyUrl,
    language: params.language || Language.MARATHI,
  });
}

export { buildWhatsAppReceiptLink, buildWhatsAppShareLink, getWhatsAppReceiptMessage };
