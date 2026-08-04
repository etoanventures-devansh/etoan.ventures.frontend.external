import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

interface InvoiceClient {
  key: string;
  label: string;
  companyName: string;
  attention: string;
  addressLines: string[];
  defaultProjectSite: string;
}

interface InvoiceFormValue {
  client: string;
  invoiceDate: Date;
  invoiceNumber: string;
  claimMonth: Date;
  projectSite: string;
  amount: number | null;
  applyGst: boolean;
  gstRate: number;
}

@Component({
  selector: 'app-etoan-invoice',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
  ],
  templateUrl: './etoan-invoice.component.html',
  styleUrl: './etoan-invoice.component.scss',
  standalone: true,
})
export class EtoanInvoiceComponent {
  @ViewChild('invoiceDocument')
  private invoiceDocument?: ElementRef<HTMLElement>;

  readonly clients: InvoiceClient[] = [
    {
      key: 'iet',
      label: 'IET Pte Ltd',
      companyName: 'IET PTE LTD',
      attention: 'ACCOUNTS DEPARTMENT',
      addressLines: ['BLK 212 HOUGANG STREET 21', '#04-345', 'SINGAPORE 530212'],
      defaultProjectSite: 'Jurong',
    },
    {
      key: 'markpoint',
      label: 'Markpoint Engineering Pte Ltd',
      companyName: 'MARKPOINT ENGINEERING PTE LTD',
      attention: 'HR DEPARTMENT',
      addressLines: ['10 ADMIRALTY STREET', '#02-27, NORTH LINK BUILDING', 'SINGAPORE 757695'],
      defaultProjectSite: 'Oriental Plaza',
    },
    {
      key: 'infinity',
      label: 'Infinity Brothers Pte Ltd',
      companyName: 'INFINITY BROTHERS PTE LTD',
      attention: 'ACCOUNTS DEPARTMENT',
      addressLines: ['BLK 146 BEDOK RESERVOIR ROAD', '#05-1643', 'SINGAPORE 470146'],
      defaultProjectSite: 'Element N105',
    },
    {
      key: 'mxt',
      label: 'MXT Engg & Controls',
      companyName: 'MXT ENGG & CONTROLS',
      attention: 'HR DEPARTMENT',
      addressLines: ['15 MARSILING LANE', '#11-157, MARSILING GARDENS', 'SINGAPORE 730015'],
      defaultProjectSite: 'Facebook at 15A Sunview Way',
    },
  ];

  invoice: InvoiceFormValue = {
    client: 'iet',
    invoiceDate: new Date(),
    invoiceNumber: '',
    claimMonth: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    projectSite: 'Jurong',
    amount: null,
    applyGst: false,
    gstRate: 9,
  };

  previewVisible = false;
  isGenerating = false;
  validationMessage = '';
  actionMessage = '';
  actionError = '';

  get selectedClient(): InvoiceClient {
    return this.clients.find((client) => client.key === this.invoice.client) ?? this.clients[0];
  }

  get subtotal(): number {
    return Number(this.invoice.amount ?? 0);
  }

  get gstAmount(): number {
    if (!this.invoice.applyGst) return 0;
    return this.roundCurrency(this.subtotal * (Number(this.invoice.gstRate || 0) / 100));
  }

  get netClaim(): number {
    return this.roundCurrency(this.subtotal + this.gstAmount);
  }

  get invoiceDateLabel(): string {
    return this.formatDate(this.invoice.invoiceDate);
  }

  get claimMonthLabel(): string {
    return new Intl.DateTimeFormat('en-SG', {
      month: 'long',
      year: 'numeric',
    }).format(this.invoice.claimMonth);
  }

  get amountInWords(): string {
    const amount = Math.max(0, this.netClaim);
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);

    return `Singapore Dollars ${this.numberToWords(dollars)} and ${this.numberToWords(cents)} Cents Only`;
  }

  get fileName(): string {
    const client = this.selectedClient.companyName
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const invoiceNo = (this.invoice.invoiceNumber || 'Draft')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `Invoice-${client}-${invoiceNo}.pdf`;
  }

  onClientChanged(): void {
    this.invoice.projectSite = this.selectedClient.defaultProjectSite;
    this.clearStatus();
  }

  openInvoicePreview(): void {
    this.clearStatus();

    if (!this.invoice.client) {
      this.validationMessage = 'Please select a client.';
      return;
    }

    if (!this.invoice.invoiceNumber.trim()) {
      this.validationMessage = 'Please enter the invoice number.';
      return;
    }

    if (!this.invoice.projectSite.trim()) {
      this.validationMessage = 'Please enter the project site.';
      return;
    }

    if (!this.invoice.amount || this.invoice.amount <= 0) {
      this.validationMessage = 'Please enter an invoice amount greater than zero.';
      return;
    }

    if (this.invoice.applyGst && this.invoice.gstRate < 0) {
      this.validationMessage = 'GST rate cannot be negative.';
      return;
    }

    this.previewVisible = true;
  }

  closePreview(): void {
    this.clearStatus();
  }

  async downloadPdf(): Promise<void> {
    this.clearStatus();
    this.isGenerating = true;

    try {
      const pdf = await this.createPdf();
      pdf.save(this.fileName);
      this.actionMessage = 'Invoice PDF downloaded successfully.';
    } catch (error) {
      console.error('Unable to generate invoice PDF', error);
      this.actionError = 'Unable to generate the invoice PDF. Please try again.';
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
        title: `Invoice ${this.invoice.invoiceNumber}`,
        text: `${this.selectedClient.companyName} - ${this.claimMonthLabel}`,
        files: [file],
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        this.actionMessage = 'Invoice shared successfully.';
        return;
      }

      pdf.save(this.fileName);
      this.actionMessage =
        'File sharing is not supported by this browser, so the PDF was downloaded instead.';
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return;

      console.error('Unable to share invoice PDF', error);
      this.actionError = 'Unable to share the invoice PDF. Please try again.';
    } finally {
      this.isGenerating = false;
    }
  }

  async printInvoice(): Promise<void> {
    this.clearStatus();
    this.isGenerating = true;

    try {
      const pdf = await this.createPdf();
      const blobUrl = URL.createObjectURL(pdf.output('blob'));
      const printWindow = window.open(blobUrl, '_blank');

      if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        this.actionError = 'Please allow pop-ups to open the printable PDF.';
        return;
      }

      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      console.error('Unable to open printable invoice PDF', error);
      this.actionError = 'Unable to open the printable PDF. Please try again.';
    } finally {
      this.isGenerating = false;
    }
  }

  private async createPdf(): Promise<import('jspdf').jsPDF> {
    const element = this.invoiceDocument?.nativeElement;

    if (!element) {
      throw new Error('Invoice document is not available.');
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
    const margin = 5;
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
      canvas.toDataURL('image/jpeg', 0.97),
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
    this.validationMessage = '';
    this.actionMessage = '';
    this.actionError = '';
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('en-SG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private numberToWords(value: number): string {
    if (value === 0) return 'Zero';

    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = [
      { value: 1_000_000_000, label: 'Billion' },
      { value: 1_000_000, label: 'Million' },
      { value: 1_000, label: 'Thousand' },
      { value: 100, label: 'Hundred' },
    ];

    const convert = (number: number): string => {
      if (number < 20) return ones[number];
      if (number < 100) {
        return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ''}`;
      }

      for (const scale of scales) {
        if (number >= scale.value) {
          const leading = Math.floor(number / scale.value);
          const remainder = number % scale.value;
          return `${convert(leading)} ${scale.label}${remainder ? ` ${convert(remainder)}` : ''}`;
        }
      }

      return '';
    };

    return convert(Math.floor(value));
  }
}
