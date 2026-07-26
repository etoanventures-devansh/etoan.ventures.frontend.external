import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { EmployeeSalaryRecords } from '../../../models/etoan-models';

@Component({
  selector: 'app-etoan-payslip',
  standalone: true,
  imports: [CommonModule, ButtonModule, MessageModule],
  templateUrl: './etoan-payslip.component.html',
  styleUrl: './etoan-payslip.component.scss',
})
export class EtoanPayslipComponent {
  @Input({ required: true }) record!: EmployeeSalaryRecords;

  @ViewChild('payslipDocument')
  private payslipDocument?: ElementRef<HTMLElement>;

  isGenerating = false;
  actionMessage = '';
  actionError = '';

  get periodLabel(): string {
    const date = new Date(this.record.salary_year, this.record.salary_month - 1, 1);
    return new Intl.DateTimeFormat('en-SG', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  get fileName(): string {
    const employee = this.record.employee_name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `Payslip-${employee}-${this.record.salary_year}-${String(
      this.record.salary_month,
    ).padStart(2, '0')}.pdf`;
  }

  async downloadPdf(): Promise<void> {
    this.clearStatus();
    this.isGenerating = true;

    try {
      const pdf = await this.createPdf();
      pdf.save(this.fileName);
      this.actionMessage = 'Payslip PDF downloaded successfully.';
    } catch (error) {
      console.error('Unable to generate payslip PDF', error);
      this.actionError = 'Unable to generate the PDF. Please try again.';
    } finally {
      this.isGenerating = false;
    }
  }

  async sharePdf(): Promise<void> {
    this.clearStatus();
    this.isGenerating = true;

    try {
      const pdf = await this.createPdf();
      const file = new File([pdf.output('blob')], this.fileName, {
        type: 'application/pdf',
      });
      const shareData: ShareData = {
        title: `Payslip - ${this.record.employee_name}`,
        text: `Payslip for ${this.periodLabel}`,
        files: [file],
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        this.actionMessage = 'Payslip shared successfully.';
        return;
      }

      pdf.save(this.fileName);
      this.actionMessage =
        'File sharing is not supported by this browser, so the PDF was downloaded instead.';
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return;
      }

      console.error('Unable to share payslip PDF', error);
      this.actionError = 'Unable to share the PDF. Please try again.';
    } finally {
      this.isGenerating = false;
    }
  }

  printPayslip(): void {
    this.clearStatus();
    const element = this.payslipDocument?.nativeElement;

    if (!element) {
      this.actionError = 'Payslip is not ready to print.';
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=900');

    if (!printWindow) {
      this.actionError = 'Please allow pop-ups to print this payslip.';
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <base href="${document.baseURI}">
          <title>${this.fileName}</title>
          <meta charset="utf-8">
          <style>${this.getPrintStyles()}</style>
        </head>
        <body>${element.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();

    printWindow.addEventListener('load', () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    });
  }

  private async createPdf(): Promise<import('jspdf').jsPDF> {
    const element = this.payslipDocument?.nativeElement;

    if (!element) {
      throw new Error('Payslip document is not available.');
    }

    await this.waitForImages(element);

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      logging: false,
      scale: 2,
      useCORS: true,
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 6;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const imageRatio = canvas.height / canvas.width;

    let imageWidth = availableWidth;
    let imageHeight = imageWidth * imageRatio;

    if (imageHeight > availableHeight) {
      imageHeight = availableHeight;
      imageWidth = imageHeight / imageRatio;
    }

    const x = (pageWidth - imageWidth) / 2;
    const y = (pageHeight - imageHeight) / 2;

    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.96),
      'JPEG',
      x,
      y,
      imageWidth,
      imageHeight,
      undefined,
      'FAST',
    );

    return pdf;
  }

  private async waitForImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'));

    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }

            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          }),
      ),
    );
  }

  private clearStatus(): void {
    this.actionMessage = '';
    this.actionError = '';
  }

  private getPrintStyles(): string {
    return `
      @page { size: A4 portrait; margin: 6mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; color: #172033; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .payslip-sheet { width: 100%; min-height: 285mm; padding: 10mm; background: white; }
      .brand-row, .employee-grid, .payment-grid, .signature-row { display: flex; justify-content: space-between; gap: 18px; }
      .company-logo { width: 190px; height: auto; object-fit: contain; }
      .document-title { text-align: right; }
      h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
      .period { margin-top: 7px; color: #64748b; font-weight: 700; text-transform: uppercase; }
      .divider { border: 0; border-top: 2px solid #1e3a5f; margin: 18px 0; }
      .section { margin-top: 18px; }
      .section-title { margin: 0 0 8px; padding: 7px 10px; background: #eaf1f8; color: #17365d; font-size: 13px; text-transform: uppercase; letter-spacing: .6px; }
      .detail-card { flex: 1; border: 1px solid #d7e0ea; border-radius: 6px; padding: 11px 13px; }
      .detail-row { display: flex; justify-content: space-between; gap: 15px; padding: 4px 0; font-size: 12px; }
      .label { color: #64748b; }
      .value { font-weight: 700; text-align: right; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { padding: 8px 9px; background: #f4f7fa; color: #334155; text-align: left; border: 1px solid #d7e0ea; }
      td { padding: 8px 9px; border: 1px solid #d7e0ea; }
      th:last-child, td:last-child { text-align: right; }
      .summary-table { margin-top: 13px; margin-left: auto; width: 48%; }
      .summary-table .gross td { font-weight: 700; }
      .summary-table .net td { background: #17365d; color: white; font-size: 15px; font-weight: 800; }
      .payment-grid .detail-card { min-height: 86px; }
      .signature-row { margin-top: 34px; align-items: flex-end; }
      .signature-block { width: 45%; text-align: center; }
      .signature-images { position: relative; height: 90px; width: 150px; margin: 0 auto 7px; }
      .stamp { position: absolute; left: 25px; bottom: 0; width: 82px; height: 82px; object-fit: contain; opacity: .86; }
      .signature { position: absolute; left: 37px; top: 26px; width: 100px; height: 45px; object-fit: contain; }
      .signature-line { border-top: 1px solid #475569; padding-top: 6px; font-size: 11px; }
      .footer-note { margin-top: 26px; padding-top: 10px; border-top: 1px solid #d7e0ea; color: #64748b; font-size: 9px; text-align: center; }
    `;
  }
}
