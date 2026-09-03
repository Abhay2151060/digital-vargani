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
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148], // A6 pocket receipt size
  });

  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${encodeURIComponent(data.mandalSlug)}/${encodeURIComponent(data.receiptNumber)}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 120 });

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
  doc.text('Received with thanks from:', 8, 41);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.donorName, 8, 47);

  if (data.flatWing || data.donorPhone) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const subText = [data.flatWing ? `Flat/Wing: ${data.flatWing}` : '', data.donorPhone ? `Phone: ${data.donorPhone}` : ''].filter(Boolean).join(' | ');
    doc.text(subText, 8, 52);
  }

  // Amount Box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(8, 56, 89, 18, 3, 3, 'F');

  doc.setTextColor(124, 45, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Amount: Rs. ${data.amount.toLocaleString('en-IN')}/-`, 12, 64);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mode: ${data.paymentMode} | ${numberToWordsIndian(data.amount, data.language)}`, 12, 70);

  // QR Code for verification
  doc.addImage(qrDataUrl, 'PNG', 37.5, 80, 30, 30);

  doc.setTextColor(107, 100, 89);
  doc.setFontSize(7);
  doc.text('Scan QR to verify digital authenticity', 52.5, 114, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(41, 33, 24);
  doc.text(`Collected by: ${data.volunteerName}`, 8, 128);
  doc.setFontSize(7);
  doc.setTextColor(107, 100, 89);
  doc.text('Thank you for your generous devotion and support!', 52.5, 138, { align: 'center' });

  return doc.output('blob');
}
