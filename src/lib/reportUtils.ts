import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './constants';

export interface ReportHeaderInfo {
  title: string;
  centerName: string;
  period: string;
}

/**
 * Copies plain/WhatsApp formatted text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      textarea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Generates WhatsApp click-to-share URL
 */
export function getWhatsAppShareUrl(text: string, phone?: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/91${cleanPhone}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

/**
 * Converts an image file in /public to a base64 Data URL for embedding in jsPDF
 */
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generates and downloads a branded PDF report in the browser
 */
export async function generatePdfReport(params: {
  title: string;
  centerName: string;
  period: string;
  summaryItems?: Array<{ label: string; value: string | number }>;
  columns: string[];
  rows: (string | number)[][];
  fileName?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Load official logos
  const creLogo = await loadImageAsDataUrl('/cre-logo.png');
  const wisdomLogo = await loadImageAsDataUrl('/wisdom-students-logo.png');

  let currentY = 14;

  // Header banner logos
  if (creLogo) {
    try {
      doc.addImage(creLogo, 'PNG', 14, currentY, 32, 16);
    } catch (e) {
      console.warn('Could not embed cre-logo into PDF', e);
    }
  }

  if (wisdomLogo) {
    try {
      doc.addImage(wisdomLogo, 'PNG', pageWidth - 14 - 42, currentY + 2, 42, 13);
    } catch (e) {
      console.warn('Could not embed wisdom-students-logo into PDF', e);
    }
  }

  currentY += 20;

  // Organization Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(28, 52, 111); // Navy #1c346f
  doc.text('CRE – CONTINUING RELIGIOUS EDUCATION', pageWidth / 2, currentY, { align: 'center' });

  currentY += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(47, 180, 75); // Green #2fb44b
  doc.text('Wisdom Islamic Students Organization', pageWidth / 2, currentY, { align: 'center' });

  currentY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);

  currentY += 7;
  // Report Meta info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(28, 52, 111);
  doc.text(params.title.toUpperCase(), 14, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Centre: ${params.centerName}   |   Period: ${params.period}`, 14, currentY);

  currentY += 6;

  // Summary box if provided
  if (params.summaryItems && params.summaryItems.length > 0) {
    doc.setFillColor(247, 249, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'S');

    const itemWidth = (pageWidth - 28) / params.summaryItems.length;
    params.summaryItems.forEach((item, idx) => {
      const itemX = 14 + idx * itemWidth + itemWidth / 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, itemX, currentY + 5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(28, 52, 111);
      doc.text(String(item.value), itemX, currentY + 11, { align: 'center' });
    });

    currentY += 19;
  }

  // Data table with branded styling
  autoTable(doc, {
    startY: currentY,
    head: [params.columns],
    body: params.rows,
    headStyles: {
      fillColor: [28, 52, 111], // Navy #1c346f
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [247, 249, 252],
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `CRE Management Portal – Wisdom Islamic Students Organization  |  Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  const cleanTitle = (params.fileName || params.title).toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`${cleanTitle}_${Date.now()}.pdf`);
}
