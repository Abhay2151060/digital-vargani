import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Language, PaymentMode } from '@vargani/types';

export function numberToWordsIndian(num: number, lang: Language = Language.MARATHI): string {
  if (num === 0) return 'शून्य';

  const onesEn = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensEn = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const onesHi = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस'];
  const tensHi = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];

  const onesMr = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस'];
  const tensMr = ['', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];

  const onesGu = ['', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ', 'દસ', 'અગિયાર', 'બાર', 'તેર', 'ચૌદ', 'પંદર', 'સોળ', 'સત્તર', 'અઢાર', 'ઓગણીસ'];
  const tensGu = ['', '', 'વીસ', 'ત્રીસ', 'ચાલીસ', 'પચાસ', 'સાઈઠ', 'સિત્તેર', 'એંસી', 'નેવું'];

  function convertEnglish(n: number): string {
    if (n < 20) return onesEn[n];
    if (n < 100) return tensEn[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + onesEn[n % 10] : '');
    if (n < 1000) return onesEn[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertEnglish(n % 100) : '');
    if (n < 100000) return convertEnglish(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertEnglish(n % 1000) : '');
    if (n < 10000000) return convertEnglish(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertEnglish(n % 100000) : '');
    return convertEnglish(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertEnglish(n % 10000000) : '');
  }

  function convertMarathi(n: number): string {
    if (n < 20) return onesMr[n];
    if (n < 100) return tensMr[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + onesMr[n % 10] : '');
    if (n < 1000) return onesMr[Math.floor(n / 100)] + 'शे' + (n % 100 !== 0 ? ' ' + convertMarathi(n % 100) : '');
    if (n < 100000) return convertMarathi(Math.floor(n / 1000)) + ' हजार' + (n % 1000 !== 0 ? ' ' + convertMarathi(n % 1000) : '');
    if (n < 10000000) return convertMarathi(Math.floor(n / 100000)) + ' लाख' + (n % 100000 !== 0 ? ' ' + convertMarathi(n % 100000) : '');
    return convertMarathi(Math.floor(n / 10000000)) + ' कोटी' + (n % 10000000 !== 0 ? ' ' + convertMarathi(n % 10000000) : '');
  }

  const rounded = Math.floor(num);
  if (lang === Language.ENGLISH) return `${convertEnglish(rounded)} Rupees Only`;
  return `${convertMarathi(rounded)} रुपये फक्त`;
}

export interface ReceiptData {
  mandalName: string;
  mandalSlug: string;
  receiptNumber: string;
  donorName: string;
  donorPhone?: string;
  amount: number;
  paymentMode: PaymentMode;
  flatWing?: string;
  date: string;
  volunteerName: string;
  registrationNumber?: string;
  language?: Language;
  logoUrl?: string | null;
  totalPaid?: number;
  remainingAmount?: number;
  paymentStatus?: string;
  payments?: Array<{
    amount: number;
    payment_mode?: string;
    paymentMode?: string;
    created_at?: string;
    createdAt?: string;
    collector_name?: string;
    collected_by?: string;
  }>;
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148], // A6 pocket receipt size
  });

  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${encodeURIComponent(data.mandalSlug)}/${encodeURIComponent(data.receiptNumber)}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 120 });

  const totalAmount = data.amount;
  const totalPaid = typeof data.totalPaid === 'number'
    ? data.totalPaid
    : (data.paymentMode === PaymentMode.PENDING ? 0 : totalAmount);
  const remaining = typeof data.remainingAmount === 'number'
    ? data.remainingAmount
    : Math.max(0, totalAmount - totalPaid);
  const status = (data.paymentStatus || (totalPaid === 0 ? 'PENDING' : remaining <= 0.01 ? 'PAID' : 'PARTIAL')).toUpperCase();
  const isPartialFlow = totalPaid < totalAmount || (data.payments && data.payments.length > 0) || status !== 'PAID';

  // Deep Maroon / Saffron header banner
  doc.setFillColor(124, 45, 18);
  doc.rect(0, 0, 105, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');

  if (data.logoUrl && (data.logoUrl.startsWith('data:image') || data.logoUrl.startsWith('http'))) {
    try {
      doc.addImage(data.logoUrl, 'PNG', 6, 3, 16, 16);
      doc.text(data.mandalName, 60, 9, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(250, 204, 21);
      doc.text(data.registrationNumber ? `Reg: ${data.registrationNumber}` : '|| Shree Ganeshay Namah ||', 60, 15, { align: 'center' });
    } catch (e) {
      doc.text(data.mandalName, 52.5, 9, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(250, 204, 21);
      doc.text(data.registrationNumber ? `Reg: ${data.registrationNumber}` : '|| Shree Ganeshay Namah ||', 52.5, 15, { align: 'center' });
    }
  } else {
    doc.text(data.mandalName, 52.5, 9, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(250, 204, 21);
    doc.text(data.registrationNumber ? `Reg: ${data.registrationNumber}` : '|| Shree Ganeshay Namah ||', 52.5, 15, { align: 'center' });
  }

  // Receipt Number & Date
  doc.setTextColor(41, 33, 24);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${data.receiptNumber}`, 8, 30);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${data.date}`, 97, 30, { align: 'right' });

  // Border line
  doc.setDrawColor(229, 225, 216);
  doc.line(8, 34, 97, 34);

  // Donor Details
  doc.setFontSize(9);
  doc.text('Received with thanks from:', 8, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.donorName, 8, 46);

  if (data.flatWing || data.donorPhone) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const subText = [data.flatWing ? `Flat/Wing: ${data.flatWing}` : '', data.donorPhone ? `Phone: ${data.donorPhone}` : ''].filter(Boolean).join(' | ');
    doc.text(subText, 8, 51);
  }

  // Amount Box
  const amountBoxY = 54;
  const amountBoxH = isPartialFlow ? 22 : 18;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(8, amountBoxY, 89, amountBoxH, 3, 3, 'F');

  doc.setTextColor(124, 45, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  if (isPartialFlow) {
    doc.text(`Total Contribution: Rs. ${totalAmount.toLocaleString('en-IN')}/- [${status}]`, 12, amountBoxY + 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 120, 60);
    doc.text(`Paid: Rs. ${totalPaid.toLocaleString('en-IN')}`, 12, amountBoxY + 12);
    doc.setTextColor(180, 83, 9);
    doc.text(`Remaining: Rs. ${remaining.toLocaleString('en-IN')}`, 50, amountBoxY + 12);

    doc.setTextColor(124, 45, 18);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mode: ${data.paymentMode} | ${numberToWordsIndian(totalAmount, data.language)}`, 12, amountBoxY + 18);
  } else {
    doc.text(`Amount: Rs. ${totalAmount.toLocaleString('en-IN')}/-`, 12, amountBoxY + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mode: ${data.paymentMode} | ${numberToWordsIndian(totalAmount, data.language)}`, 12, amountBoxY + 14);
  }

  // Payments / Installments history + QR
  const qrY = amountBoxY + amountBoxH + 5;
  const hasPaymentsList = data.payments && data.payments.length > 0;

  if (hasPaymentsList) {
    doc.addImage(qrDataUrl, 'PNG', 8, qrY, 26, 26);
    doc.setTextColor(107, 100, 89);
    doc.setFontSize(6.5);
    doc.text('Scan to verify online', 21, qrY + 29, { align: 'center' });

    // Installment history list on right
    doc.setTextColor(124, 45, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment History (Installments):', 38, qrY + 4);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(41, 33, 24);
    data.payments!.slice(0, 4).forEach((p, i) => {
      const pMode = p.payment_mode || p.paymentMode || 'CASH';
      const pDate = p.created_at || p.createdAt ? new Date(p.created_at || p.createdAt!).toLocaleDateString('en-IN') : '';
      const pLine = `${i + 1}. Rs. ${Number(p.amount).toLocaleString('en-IN')} (${pMode})${pDate ? ` - ${pDate}` : ''}`;
      doc.text(pLine, 38, qrY + 9 + (i * 4.5));
    });
  } else {
    doc.addImage(qrDataUrl, 'PNG', 38.5, qrY + 1, 28, 28);
    doc.setTextColor(107, 100, 89);
    doc.setFontSize(7);
    doc.text('Scan QR to verify digital authenticity', 52.5, qrY + 32, { align: 'center' });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(41, 33, 24);
  doc.text(`Collected by: ${data.volunteerName}`, 8, 131);
  doc.setFontSize(7);
  doc.setTextColor(107, 100, 89);
  doc.text('Thank you for your generous devotion and support!', 52.5, 140, { align: 'center' });

  return doc.output('blob');
}
