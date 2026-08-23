/**
 * WhatsApp click-to-chat message templates.
 *
 * No paid WhatsApp Business API — this builds a standard
 * `https://api.whatsapp.com/send?phone=...&text=...` deep link that opens
 * the volunteer's own WhatsApp with the message pre-filled. The volunteer
 * still taps "send" themselves; nothing is sent server-side. See
 * rules.md §2 ("What to avoid") for why the Business API is out of scope.
 */

export type ReceiptLanguage = 'mr' | 'hi' | 'gu' | 'en';

export interface WhatsAppReceiptContext {
  donorName: string;
  mandalName: string;
  amount: number;
  amountInWords: string;
  receiptNumber: string;
  receiptUrl: string; // e.g. https://yourapp.in/r/GSB-2026-0142
  language: ReceiptLanguage;
  donorPhone: string; // E.164 or bare 10-digit; normalized below
}

/**
 * One template function per language. Keep these short — WhatsApp
 * pre-fill has practical length limits, and a long message reads as
 * spam. Placeholders are filled positionally to keep grammar natural
 * in each language rather than concatenating fixed English fragments.
 */
const TEMPLATES: Record<ReceiptLanguage, (c: WhatsAppReceiptContext) => string> = {
  en: (c) =>
    `Namaste ${c.donorName} ji,\n\n` +
    `Thank you for your generous donation of ₹${c.amount.toLocaleString('en-IN')} ` +
    `(${c.amountInWords}) to ${c.mandalName}.\n\n` +
    `Receipt no: ${c.receiptNumber}\n` +
    `View/download your receipt: ${c.receiptUrl}\n\n` +
    `Your support means a lot to us. 🙏`,

  mr: (c) =>
    `नमस्कार ${c.donorName} जी,\n\n` +
    `${c.mandalName} साठी आपण दिलेल्या ₹${c.amount.toLocaleString('en-IN')} ` +
    `(${c.amountInWords}) च्या वर्गणीबद्दल मनःपूर्वक धन्यवाद.\n\n` +
    `पावती क्रमांक: ${c.receiptNumber}\n` +
    `पावती पहा/डाउनलोड करा: ${c.receiptUrl}\n\n` +
    `आपल्या सहकार्याबद्दल आभारी आहोत. 🙏`,

  hi: (c) =>
    `नमस्ते ${c.donorName} जी,\n\n` +
    `${c.mandalName} के लिए आपके ₹${c.amount.toLocaleString('en-IN')} ` +
    `(${c.amountInWords}) के उदार दान के लिए धन्यवाद.\n\n` +
    `रसीद क्रमांक: ${c.receiptNumber}\n` +
    `रसीद देखें/डाउनलोड करें: ${c.receiptUrl}\n\n` +
    `आपके सहयोग के लिए आभार. 🙏`,

  gu: (c) =>
    `નમસ્તે ${c.donorName} જી,\n\n` +
    `${c.mandalName} માટે તમારા ₹${c.amount.toLocaleString('en-IN')} ` +
    `(${c.amountInWords}) ના ઉદાર દાન બદલ આભાર.\n\n` +
    `રસીદ ક્રમાંક: ${c.receiptNumber}\n` +
    `રસીદ જુઓ/ડાઉનલોડ કરો: ${c.receiptUrl}\n\n` +
    `તમારા સહયોગ બદલ આભારી છીએ. 🙏`,
};

/** Strips spaces/dashes and ensures a country code, defaulting to India (+91). */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits; // already has a country code the caller supplied
}

/**
 * Builds the full click-to-chat URL. Call this from the "Share receipt"
 * button — open it with `window.open(url, '_blank')` so the volunteer's
 * own WhatsApp (app or web) takes over from there.
 */
export function buildWhatsAppReceiptLink(ctx: WhatsAppReceiptContext): string {
  const message = TEMPLATES[ctx.language](ctx);
  const phone = normalizePhone(ctx.donorPhone);
  const params = new URLSearchParams({ phone, text: message });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

/**
 * Fallback for donors without a phone number captured, or when the
 * volunteer wants to share without a specific recipient pre-filled
 * (e.g. forwarding to a family WhatsApp group). Omits `phone`.
 */
export function buildWhatsAppShareLink(ctx: Omit<WhatsAppReceiptContext, 'donorPhone'>): string {
  const message = TEMPLATES[ctx.language](ctx as WhatsAppReceiptContext);
  const params = new URLSearchParams({ text: message });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}
