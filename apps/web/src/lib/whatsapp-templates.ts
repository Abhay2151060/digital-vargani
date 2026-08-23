/**
 * WhatsApp click-to-chat message templates & deep link builders.
 *
 * Supports English and Marathi with clean, polite, and verified receipt links.
 */

import { Language } from '@vargani/types';

export type ReceiptLanguage = 'mr' | 'en';

export interface WhatsAppReceiptContext {
  donorName: string;
  mandalName: string;
  amount: number;
  amountInWords: string;
  receiptNumber: string;
  receiptUrl: string; // e.g. https://digitalvargani.in/r/SSMM-001
  language: ReceiptLanguage | Language;
  donorPhone?: string; // 10-digit or E.164
}

/**
 * Localized templates for Marathi and English.
 */
export const WHATSAPP_TEMPLATES: Record<ReceiptLanguage, (c: WhatsAppReceiptContext) => string> = {
  mr: (c) =>
    `🚩 *${c.mandalName}* 🚩\n` +
    `॥ श्री गणेशाय नमः ॥\n\n` +
    `नमस्कार *${c.donorName}* जी,\n\n` +
    `${c.mandalName} साठी आपण दिलेल्या *₹${c.amount.toLocaleString('en-IN')}/-* (${c.amountInWords}) च्या वर्गणीबद्दल मनःपूर्वक धन्यवाद.\n\n` +
    `📄 *पावती क्रमांक:* ${c.receiptNumber}\n` +
    `🔍 *अधिकृत डिजिटल पावती पहा / डाउनलोड करा:*\n${c.receiptUrl}\n\n` +
    `आपल्या सहकार्याबद्दल आम्ही आभारी आहोत. गणपती बाप्पा मोरया! 🙏🚩`,

  en: (c) =>
    `🚩 *${c.mandalName}* 🚩\n` +
    `|| Shree Ganeshay Namah ||\n\n` +
    `Namaste *${c.donorName}* ji,\n\n` +
    `Thank you for your generous donation of *₹${c.amount.toLocaleString('en-IN')}/-* (${c.amountInWords}) to *${c.mandalName}*.\n\n` +
    `📄 *Receipt No:* ${c.receiptNumber}\n` +
    `🔍 *View / Download Official Digital Receipt:*\n${c.receiptUrl}\n\n` +
    `Your valuable support means a lot to us. 🙏🚩`,
};

/** Strips non-digits and ensures Indian country code (+91). */
export function normalizeIndianPhone(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Returns raw text of the WhatsApp message.
 */
export function getWhatsAppReceiptMessage(ctx: WhatsAppReceiptContext): string {
  const langKey: ReceiptLanguage = ctx.language === 'en' ? 'en' : 'mr';
  return WHATSAPP_TEMPLATES[langKey](ctx);
}

/**
 * Builds the full click-to-chat URL with recipient phone and pre-filled message.
 */
export function buildWhatsAppReceiptLink(ctx: WhatsAppReceiptContext): string {
  const message = getWhatsAppReceiptMessage(ctx);
  const phone = normalizeIndianPhone(ctx.donorPhone);
  const params = new URLSearchParams();
  if (phone) {
    params.set('phone', phone);
  }
  params.set('text', message);
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

/**
 * Fallback share link without a pre-filled phone number (for groups/forwarding).
 */
export function buildWhatsAppShareLink(ctx: Omit<WhatsAppReceiptContext, 'donorPhone'>): string {
  const message = getWhatsAppReceiptMessage(ctx as WhatsAppReceiptContext);
  const params = new URLSearchParams({ text: message });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}
