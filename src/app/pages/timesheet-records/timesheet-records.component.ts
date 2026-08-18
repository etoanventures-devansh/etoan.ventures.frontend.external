import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import { MonthlyWorkerTimesheet } from '../../models/etoan-models';
import { EtoanHttpService } from '../../services/etoan-http-service.service';

interface ProjectFilterOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-timesheet-records',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './timesheet-records.component.html',
  styleUrl: './timesheet-records.component.scss',
})
export class TimesheetRecordsComponent implements OnInit {
  @ViewChild('projectTimesheetDocument')
  private projectTimesheetDocument?: ElementRef<HTMLElement>;

  private readonly fb = new FormBuilder();

  records: MonthlyWorkerTimesheet[] = [];
  isLoading = false;
  loadError = '';

  pdfPreviewVisible = false;
  isGeneratingPdf = false;
  pdfActionMessage = '';
  pdfActionError = '';

  readonly filters = this.fb.group({
    search: this.fb.control<string>('', { nonNullable: true }),
    projectSiteId: this.fb.control<number | null>(null),
    monthYear: this.fb.control<Date | null>(null),
  });

  constructor(
    private readonly http: EtoanHttpService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  get projectOptions(): ProjectFilterOption[] {
    const projects = new Map<number, string>();
    for (const record of this.records) {
      projects.set(record.project_site_id, record.project_site_name);
    }

    return [...projects.entries()]
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  get filteredRecords(): MonthlyWorkerTimesheet[] {
    const search = this.filters.controls.search.value.trim().toLowerCase();
    const projectSiteId = this.filters.controls.projectSiteId.value;
    const monthYear = this.filters.controls.monthYear.value;

    return this.records.filter((record) => {
      const matchesSearch =
        !search ||
        [
          record.employee_name,
          record.identifier_number,
          record.project_site_name,
          record.site_owner,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesProject =
        !projectSiteId || record.project_site_id === projectSiteId;

      const matchesMonth =
        !monthYear ||
        (record.work_year === monthYear.getFullYear() &&
          record.work_month === monthYear.getMonth() + 1);

      return matchesSearch && matchesProject && matchesMonth;
    });
  }

  get projectMonthRecords(): MonthlyWorkerTimesheet[] {
    const projectSiteId = this.filters.controls.projectSiteId.value;
    const monthYear = this.filters.controls.monthYear.value;

    if (!projectSiteId || !monthYear) return [];

    return this.records.filter(
      (record) =>
        record.project_site_id === projectSiteId &&
        record.work_year === monthYear.getFullYear() &&
        record.work_month === monthYear.getMonth() + 1,
    );
  }

  get canCreateProjectPdf(): boolean {
    return this.projectMonthRecords.length > 0;
  }

  get filteredTotalHours(): number {
    return this.round(
      this.filteredRecords.reduce(
        (sum, record) => sum + Number(record.total_hours || 0),
        0,
      ),
    );
  }

  get filteredTotalAmount(): number {
    return this.round(
      this.filteredRecords.reduce(
        (sum, record) => sum + Number(record.total_amount || 0),
        0,
      ),
    );
  }

  get reviewRecordsCount(): number {
    return this.filteredRecords.filter(
      (record) => Number(record.review_count || 0) > 0,
    ).length;
  }

  get pdfDays(): number[] {
    const month = this.filters.controls.monthYear.value;
    if (!month) return [];

    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();

    return Array.from({ length: count }, (_, index) => index + 1);
  }

  get pdfMonthLabel(): string {
    const month = this.filters.controls.monthYear.value;
    return month
      ? month.toLocaleDateString('en-SG', {
          month: 'long',
          year: 'numeric',
        })
      : '';
  }

  get pdfProjectName(): string {
    const id = this.filters.controls.projectSiteId.value;
    return (
      this.projectOptions.find((option) => option.value === id)?.label ??
      'Project'
    );
  }

  get pdfTotalAmount(): number {
    return this.round(
      this.projectMonthRecords.reduce(
        (sum, record) => sum + Number(record.total_amount || 0),
        0,
      ),
    );
  }

  get projectPdfFileName(): string {
    const clean = (value: string) =>
      value
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `Timesheet-${clean(this.pdfProjectName)}-${clean(
      this.pdfMonthLabel,
    )}.pdf`;
  }

  loadRecords(): void {
    this.isLoading = true;
    this.loadError = '';

    this.http
      .fetchMonthlyWorkerTimesheets()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(({ data, error }) => {
        if (error) {
          this.records = [];
          this.loadError =
            error.message ??
            'Unable to load timesheet records. Check the Supabase table setup.';
          return;
        }

        this.records = (data ?? []) as MonthlyWorkerTimesheet[];
      });
  }

  createNew(): void {
    void this.router.navigate(['/timesheet-entry']);
  }

  clearFilters(): void {
    this.filters.reset({
      search: '',
      projectSiteId: null,
      monthYear: null,
    });
  }

  openRecord(record: MonthlyWorkerTimesheet): void {
    if (!record.id) return;

    void this.router.navigate(['/timesheet-entry'], {
      queryParams: { id: record.id },
    });
  }

  openProjectPdfPreview(): void {
    if (!this.canCreateProjectPdf) return;

    this.pdfActionMessage = '';
    this.pdfActionError = '';
    this.pdfPreviewVisible = true;
  }

  async downloadProjectPdf(): Promise<void> {
    this.pdfActionMessage = '';
    this.pdfActionError = '';
    this.isGeneratingPdf = true;

    try {
      const pdf = await this.createProjectPdf();
      pdf.save(this.projectPdfFileName);
      this.pdfActionMessage = 'Project timesheet PDF downloaded successfully.';
    } catch (error) {
      console.error(error);
      this.pdfActionError = 'Unable to generate the project PDF. Please try again.';
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  async openProjectPdf(): Promise<void> {
    this.pdfActionMessage = '';
    this.pdfActionError = '';
    this.isGeneratingPdf = true;

    try {
      const pdf = await this.createProjectPdf();
      const blobUrl = URL.createObjectURL(pdf.output('blob'));
      const pdfWindow = window.open(blobUrl, '_blank');

      if (!pdfWindow) {
        URL.revokeObjectURL(blobUrl);
        this.pdfActionError = 'Please allow pop-ups to open the PDF.';
        return;
      }

      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      console.error(error);
      this.pdfActionError = 'Unable to open the project PDF. Please try again.';
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  monthLabel(record: MonthlyWorkerTimesheet): string {
    return new Date(
      record.work_year,
      record.work_month - 1,
      1,
    ).toLocaleDateString('en-SG', {
      month: 'short',
      year: 'numeric',
    });
  }

  statusSeverity(record: MonthlyWorkerTimesheet): 'success' | 'warn' {
    return Number(record.review_count || 0) > 0 ? 'warn' : 'success';
  }

  statusLabel(record: MonthlyWorkerTimesheet): string {
    return Number(record.review_count || 0) > 0
      ? `${record.review_count} to review`
      : 'Ready';
  }

  weekdayLabel(day: number): string {
    const month = this.filters.controls.monthYear.value;
    if (!month) return '';

    return new Date(month.getFullYear(), month.getMonth(), day)
      .toLocaleDateString('en-SG', { weekday: 'short' })
      .toUpperCase();
  }

  recordDayValue(record: MonthlyWorkerTimesheet, day: number): string {
    const entry = (record.daily_entries ?? []).find(
      (item) => item.day === day,
    );

    if (!entry || entry.status !== 'WORK') return '';

    const value = Number(entry.totalHours || 0);
    return value ? this.formatHours(value) : '';
  }

  formatHours(value: number): string {
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  private async createProjectPdf(): Promise<import('jspdf').jsPDF> {
    const element = this.projectTimesheetDocument?.nativeElement;

    if (!element) {
      throw new Error('Project timesheet preview is not available.');
    }

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
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 4;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const ratio = canvas.height / canvas.width;

    let imageWidth = availableWidth;
    let imageHeight = imageWidth * ratio;

    if (imageHeight > availableHeight) {
      imageHeight = availableHeight;
      imageWidth = imageHeight / ratio;
    }

    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.98),
      'JPEG',
      (pageWidth - imageWidth) / 2,
      (pageHeight - imageHeight) / 2,
      imageWidth,
      imageHeight,
      undefined,
      'FAST',
    );

    return pdf;
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
