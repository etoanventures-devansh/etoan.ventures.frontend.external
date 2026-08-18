import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import {
  combineLatest,
  filter,
  firstValueFrom,
  take,
} from 'rxjs';

import {
  EmployeeDetails,
  MonthlyTimesheetDayEntry,
  MonthlyTimesheetDayStatus,
  MonthlyWorkerTimesheet,
  ProjectSites,
  WorkerProjectRate,
} from '../../models/etoan-models';
import {
  GeminiService,
  TimesheetDay,
  TimesheetPeriodHint,
} from '../../services/google-gemini.service';
import { EtoanHttpService } from '../../services/etoan-http-service.service';
import { EtoanSandboxService } from '../../store/sandbox/etoan-sandbox';

interface UploadedTimecard {
  id: string;
  file: File;
  previewUrl: string;
  periodHintControl: FormControl<TimesheetPeriodHint>;
}

type DayFormGroup = FormGroup<{
  day: FormControl<number>;
  date: FormControl<string>;
  startTime: FormControl<string | null>;
  endTime: FormControl<string | null>;
  basicHours: FormControl<number>;
  overtimeHours: FormControl<number>;
  totalHours: FormControl<number>;
  confidence: FormControl<number | null>;
  remarks: FormControl<string | null>;
  status: FormControl<MonthlyTimesheetDayStatus>;
  sourceFileName: FormControl<string | null>;
  periodHint: FormControl<string | null>;
}>;

@Component({
  selector: 'app-timesheet-entry',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    DividerModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './timesheet-entry.component.html',
  styleUrl: './timesheet-entry.component.scss',
})
export class TimesheetEntryComponent implements OnInit, OnDestroy {
  @ViewChild('timesheetDocument')
  private timesheetDocument?: ElementRef<HTMLElement>;

  private readonly fb = new FormBuilder();
  private routeRecordId: string | null = null;
  private isApplyingLoadedRecord = false;

  workers: EmployeeDetails[] = [];
  projectSites: ProjectSites[] = [];
  uploadedCards: UploadedTimecard[] = [];
  loadedSourceFiles: Array<{
    name: string;
    size: number;
    periodHint: string;
  }> = [];

  isPageLoading = true;
  isProcessing = false;
  isSaving = false;
  isLoadingSaved = false;
  isGeneratingPdf = false;
  hasExtractionRun = false;
  existingRecordId: string | null = null;

  processingStatus = 'Ready';
  rateStatus: 'idle' | 'loading' | 'loaded' | 'missing' | 'error' = 'idle';
  pdfPreviewVisible = false;
  pdfActionMessage = '';
  pdfActionError = '';

  readonly periodHintOptions: Array<{
    label: string;
    value: TimesheetPeriodHint;
  }> = [
    { label: 'Auto detect', value: 'AUTO' },
    { label: 'Full month', value: 'FULL_MONTH' },
    { label: 'First half (1-15)', value: 'FIRST_HALF' },
    { label: 'Second half (16-end)', value: 'SECOND_HALF' },
  ];

  readonly statusOptions: Array<{
    label: string;
    value: MonthlyTimesheetDayStatus;
  }> = [
    { label: 'Work', value: 'WORK' },
    { label: 'Off', value: 'OFF' },
    { label: 'MC', value: 'MC' },
    { label: 'Review', value: 'UNKNOWN' },
  ];

  readonly form = this.fb.group({
    worker: this.fb.control<EmployeeDetails | null>(null, Validators.required),
    projectSite: this.fb.control<ProjectSites | null>(null, Validators.required),
    monthYear: this.fb.control<Date>(this.previousMonth(), Validators.required),
    workerRate: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
    ]),
    defaultBreakHours: this.fb.control<number>(1, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(4)],
    }),
    notes: this.fb.control<string>(''),
    days: this.fb.array<DayFormGroup>([]),
  });

  constructor(
    private readonly sandbox: EtoanSandboxService,
    private readonly http: EtoanHttpService,
    private readonly geminiService: GeminiService,
    private readonly messageService: MessageService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.buildMonthRows(this.form.controls.monthYear.value);
    this.routeRecordId = this.route.snapshot.queryParamMap.get('id');

    this.sandbox.getEmployeeDetails();
    this.sandbox.getProjectSites();

    combineLatest({
      workers: this.sandbox.employeeDetails$,
      projectSites: this.sandbox.projectSites$,
    })
      .pipe(
        filter(
          ({ workers, projectSites }) =>
            workers !== null && projectSites !== null,
        ),
        take(1),
      )
      .subscribe(async ({ workers, projectSites }) => {
        this.workers = [...(workers ?? [])].sort((a, b) => {
          const aInactive = a.status?.toUpperCase() === 'INACTIVE' ? 1 : 0;
          const bInactive = b.status?.toUpperCase() === 'INACTIVE' ? 1 : 0;
          return aInactive - bInactive || a.name.localeCompare(b.name);
        });
        this.projectSites = [...(projectSites ?? [])].sort((a, b) => {
          const aInactive = a.status?.toUpperCase() === 'ACTIVE' ? 0 : 1;
          const bInactive = b.status?.toUpperCase() === 'ACTIVE' ? 0 : 1;
          return (
            aInactive - bInactive ||
            a.projectSiteName.localeCompare(b.projectSiteName)
          );
        });
        this.isPageLoading = false;

        if (this.routeRecordId) {
          await this.loadRecordById(this.routeRecordId);
        }
      });

    this.form.controls.monthYear.valueChanges.subscribe((month) => {
      if (this.isApplyingLoadedRecord) return;
      this.buildMonthRows(month);
      this.resetRecordIdentity();
    });

    this.form.controls.worker.valueChanges.subscribe(() => {
      if (this.isApplyingLoadedRecord) return;
      this.resetRecordIdentity();
      void this.loadRateForSelection();
    });

    this.form.controls.projectSite.valueChanges.subscribe(() => {
      if (this.isApplyingLoadedRecord) return;
      this.resetRecordIdentity();
      void this.loadRateForSelection();
    });
  }

  ngOnDestroy(): void {
    this.uploadedCards.forEach((card) => URL.revokeObjectURL(card.previewUrl));
  }

  get days(): FormArray<DayFormGroup> {
    return this.form.controls.days;
  }

  get totalBasicHours(): number {
    return this.roundHours(
      this.days.controls.reduce(
        (sum, row) => sum + Number(row.controls.basicHours.value || 0),
        0,
      ),
    );
  }

  get totalOvertimeHours(): number {
    return this.roundHours(
      this.days.controls.reduce(
        (sum, row) => sum + Number(row.controls.overtimeHours.value || 0),
        0,
      ),
    );
  }

  get totalHours(): number {
    return this.roundHours(
      this.days.controls.reduce(
        (sum, row) => sum + Number(row.controls.totalHours.value || 0),
        0,
      ),
    );
  }

  get daysWorked(): number {
    return this.days.controls.filter(
      (row) =>
        row.controls.status.value === 'WORK' &&
        row.controls.totalHours.value > 0,
    ).length;
  }

  get reviewCount(): number {
    if (!this.hasExtractionRun && !this.existingRecordId) return 0;

    return this.days.controls.filter((row) => {
      const confidence = row.controls.confidence.value;
      return (
        row.controls.status.value === 'UNKNOWN' ||
        (confidence !== null && confidence < 0.6)
      );
    }).length;
  }

  get workerRate(): number {
    return Number(this.form.controls.workerRate.value || 0);
  }

  get totalAmount(): number {
    return this.roundCurrency(this.totalHours * this.workerRate);
  }

  get monthLabel(): string {
    const month = this.form.controls.monthYear.value;
    return month
      ? month.toLocaleDateString('en-SG', {
          month: 'long',
          year: 'numeric',
        })
      : '';
  }

  get pdfFileName(): string {
    const worker = this.form.controls.worker.value?.name || 'Worker';
    const project = this.form.controls.projectSite.value?.projectSiteName || 'Project';
    const month = this.monthLabel || 'Month';

    const clean = (value: string) =>
      value
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `Timesheet-${clean(worker)}-${clean(project)}-${clean(month)}.pdf`;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (!files.length) return;

    this.loadedSourceFiles = [];
    const remainingSlots = Math.max(0, 2 - this.uploadedCards.length);
    const accepted = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Maximum 2 images',
        detail: 'Use one full-month card or two half-month cards.',
      });
    }

    for (const file of accepted) {
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Unsupported file',
          detail: `${file.name} is not an image.`,
        });
        continue;
      }

      this.uploadedCards.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        periodHintControl: this.fb.control<TimesheetPeriodHint>('AUTO', {
          nonNullable: true,
        }),
      });
    }

    this.applySmartPeriodHints();
  }

  removeCard(card: UploadedTimecard): void {
    URL.revokeObjectURL(card.previewUrl);
    this.uploadedCards = this.uploadedCards.filter((item) => item.id !== card.id);
    this.applySmartPeriodHints();
  }

  async runGemini(): Promise<void> {
    if (!this.validateHeader(false)) return;

    if (!this.uploadedCards.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Upload a timecard',
        detail: 'Choose one full-month image or up to two half-month images.',
      });
      return;
    }

    const worker = this.form.controls.worker.value!;
    const site = this.form.controls.projectSite.value!;
    const month = this.form.controls.monthYear.value!;
    const merged = new Map<
      number,
      TimesheetDay & { sourceFileName: string; periodHint: string }
    >();

    this.isProcessing = true;
    this.processingStatus = 'Preparing timecard images...';
    this.clearExtractedRows();
    this.hasExtractionRun = false;

    try {
      for (let index = 0; index < this.uploadedCards.length; index++) {
        const card = this.uploadedCards[index];
        this.processingStatus = `Gemini is reading timecard ${index + 1} of ${
          this.uploadedCards.length
        }...`;

        const result = await this.geminiService.extractTimesheet(
          card.file,
          worker.name,
          site.projectSiteName,
          month.getMonth() + 1,
          month.getFullYear(),
          card.periodHintControl.value,
        );

        for (const entry of result.entries) {
          if (entry.day > this.days.length) continue;

          const existing = merged.get(entry.day);
          if (!existing || entry.confidence > existing.confidence) {
            merged.set(entry.day, {
              ...entry,
              sourceFileName: card.file.name,
              periodHint: card.periodHintControl.value,
            });
          }
        }
      }

      if (!merged.size) {
        throw new Error(
          'Gemini did not return any date rows. Check the image orientation/clarity and try again.',
        );
      }

      this.applyGeminiRows(merged);
      this.hasExtractionRun = true;
      this.processingStatus = 'Extraction complete';

      this.messageService.add({
        severity: this.reviewCount ? 'warn' : 'success',
        summary: 'Gemini extraction complete',
        detail: `${merged.size} day rows extracted. ${this.reviewCount} row(s) need review.`,
      });
    } catch (error) {
      console.error('Gemini extraction failed', error);
      this.processingStatus = 'Extraction failed';
      this.messageService.add({
        severity: 'error',
        summary: 'Gemini extraction failed',
        detail:
          error instanceof Error
            ? error.message
            : 'Unable to extract the timecard image.',
      });
    } finally {
      this.isProcessing = false;
    }
  }

  onStatusChanged(index: number): void {
    const row = this.days.at(index);
    const status = row.controls.status.value;

    if (status === 'OFF' || status === 'MC') {
      row.patchValue(
        {
          startTime: null,
          endTime: null,
          basicHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          confidence: null,
        },
        { emitEvent: false },
      );
      return;
    }

    if (status === 'WORK' && row.controls.totalHours.value === 0) {
      this.recalculateFromTimes(index);
    }
  }

  recalculateFromTimes(index: number): void {
    const row = this.days.at(index);
    const start = this.parseTimeToHours(row.controls.startTime.value);
    const end = this.parseTimeToHours(row.controls.endTime.value);

    if (start === null || end === null) return;

    let adjustedEnd = end;
    let elapsed = adjustedEnd - start;

    if (elapsed > 0 && elapsed < 7 && adjustedEnd <= 11) {
      adjustedEnd += 12;
      elapsed = adjustedEnd - start;
    }

    if (elapsed < 0) {
      adjustedEnd += 24;
      elapsed = adjustedEnd - start;
    }

    const breakHours = Number(this.form.controls.defaultBreakHours.value || 0);
    const total = this.roundHours(Math.max(0, elapsed - breakHours));
    const basic = this.roundHours(Math.min(8, total));
    const overtime = this.roundHours(Math.max(0, total - basic));

    row.patchValue(
      {
        basicHours: basic,
        overtimeHours: overtime,
        totalHours: total,
        status: total > 0 ? 'WORK' : row.controls.status.value,
        confidence: null,
      },
      { emitEvent: false },
    );
  }

  onBasicOrOvertimeEdited(index: number): void {
    const row = this.days.at(index);
    const basic = Number(row.controls.basicHours.value || 0);
    const overtime = Number(row.controls.overtimeHours.value || 0);
    const total = this.roundHours(Math.max(0, basic + overtime));

    row.patchValue(
      {
        totalHours: total,
        status: total > 0 ? 'WORK' : row.controls.status.value,
        confidence: null,
      },
      { emitEvent: false },
    );
  }

  onTotalEdited(index: number): void {
    const row = this.days.at(index);
    const total = this.roundHours(
      Math.max(0, Number(row.controls.totalHours.value || 0)),
    );

    row.patchValue(
      {
        basicHours: this.roundHours(Math.min(8, total)),
        overtimeHours: this.roundHours(Math.max(0, total - 8)),
        status: total > 0 ? 'WORK' : row.controls.status.value,
        confidence: null,
      },
      { emitEvent: false },
    );
  }

  setBlankDaysOff(): void {
    for (const row of this.days.controls) {
      if (
        !row.controls.startTime.value &&
        !row.controls.endTime.value &&
        row.controls.totalHours.value === 0 &&
        row.controls.status.value === 'UNKNOWN'
      ) {
        row.patchValue(
          {
            status: 'OFF',
            remarks: null,
            confidence: null,
          },
          { emitEvent: false },
        );
      }
    }
  }

  clearExtractedRows(): void {
    for (const row of this.days.controls) {
      row.patchValue(
        {
          startTime: null,
          endTime: null,
          basicHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          confidence: null,
          remarks: null,
          status: 'UNKNOWN',
          sourceFileName: null,
          periodHint: null,
        },
        { emitEvent: false },
      );
    }
    this.hasExtractionRun = false;
  }

  async loadSavedTimesheet(): Promise<void> {
    if (!this.validateHeader(false)) return;

    const worker = this.form.controls.worker.value!;
    const site = this.form.controls.projectSite.value!;
    const month = this.form.controls.monthYear.value!;

    this.isLoadingSaved = true;
    try {
      const response = await firstValueFrom(
        this.http.fetchMonthlyWorkerTimesheet(
          worker.entityId,
          site.id,
          month.getFullYear(),
          month.getMonth() + 1,
        ),
      );

      if (response.error) {
        throw new Error(response.error.message ?? 'Unable to load timesheet.');
      }

      const record = (response.data?.[0] ?? null) as MonthlyWorkerTimesheet | null;
      if (!record) {
        this.messageService.add({
          severity: 'info',
          summary: 'No saved timesheet',
          detail: 'There is no saved record for this worker, project and month.',
        });
        return;
      }

      this.applySavedRecord(record);
      this.messageService.add({
        severity: 'success',
        summary: 'Timesheet loaded',
        detail: `${record.employee_name} - ${this.monthLabel}`,
      });
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to load',
        detail:
          error instanceof Error
            ? error.message
            : 'Could not load the saved timesheet.',
      });
    } finally {
      this.isLoadingSaved = false;
    }
  }

  async saveTimesheet(): Promise<void> {
    if (!this.validateHeader(true)) return;

    if (this.totalHours <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No hours to save',
        detail: 'Run Gemini or enter the monthly hours before saving.',
      });
      return;
    }

    this.isSaving = true;

    try {
      const worker = this.form.controls.worker.value!;
      const site = this.form.controls.projectSite.value!;
      const rate = this.workerRate;

      const ratePayload: WorkerProjectRate = {
        employee_entity_id: worker.entityId,
        employee_name: worker.name,
        project_site_id: site.id,
        project_site_name: site.projectSiteName,
        rate_per_hour: rate,
        is_active: true,
      };

      const rateResponse = await firstValueFrom(
        this.http.upsertWorkerProjectRate(ratePayload),
      );
      if (rateResponse.error) {
        throw new Error(
          rateResponse.error.message ??
            'Unable to save the worker project rate.',
        );
      }

      const payload = this.buildPayload();
      const response = await firstValueFrom(
        this.http.upsertMonthlyWorkerTimesheet(payload),
      );

      if (response.error) {
        throw new Error(
          response.error.message ??
            'Unable to save the monthly timesheet.',
        );
      }

      this.existingRecordId = response.data?.[0]?.id ?? this.existingRecordId;
      this.rateStatus = 'loaded';

      this.messageService.add({
        severity: 'success',
        summary: 'Monthly timesheet saved',
        detail: `${payload.total_hours} hours x $${payload.worker_rate.toFixed(
          2,
        )} = $${payload.total_amount.toFixed(2)}`,
      });
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Save failed',
        detail:
          error instanceof Error
            ? error.message
            : 'Unable to save the monthly timesheet.',
      });
    } finally {
      this.isSaving = false;
    }
  }

  openPdfPreview(): void {
    if (!this.validateHeader(true)) return;

    if (this.totalHours <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No hours to export',
        detail: 'Enter or extract the monthly hours before creating the PDF.',
      });
      return;
    }

    this.pdfActionMessage = '';
    this.pdfActionError = '';
    this.pdfPreviewVisible = true;
  }

  async downloadPdf(): Promise<void> {
    this.pdfActionMessage = '';
    this.pdfActionError = '';
    this.isGeneratingPdf = true;

    try {
      const pdf = await this.createPdf();
      pdf.save(this.pdfFileName);
      this.pdfActionMessage = 'Timesheet PDF downloaded successfully.';
    } catch (error) {
      console.error(error);
      this.pdfActionError = 'Unable to generate the PDF. Please try again.';
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  async openPdf(): Promise<void> {
    this.pdfActionMessage = '';
    this.pdfActionError = '';
    this.isGeneratingPdf = true;

    try {
      const pdf = await this.createPdf();
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
      this.pdfActionError = 'Unable to open the PDF. Please try again.';
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  confidenceSeverity(
    confidence: number | null,
  ): 'success' | 'warn' | 'danger' | 'secondary' {
    if (confidence === null) return 'secondary';
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warn';
    return 'danger';
  }

  confidenceLabel(confidence: number | null): string {
    return confidence === null
      ? 'Manual'
      : `${Math.round(confidence * 100)}%`;
  }

  weekdayLabel(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day)
      .toLocaleDateString('en-SG', { weekday: 'short' })
      .toUpperCase();
  }

  pdfDayValue(row: DayFormGroup): string {
    if (row.controls.status.value !== 'WORK') return '';
    const value = Number(row.controls.totalHours.value || 0);
    return value ? this.formatHours(value) : '';
  }

  formatHours(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  private applySmartPeriodHints(): void {
    if (this.uploadedCards.length === 1) {
      if (
        this.uploadedCards[0].periodHintControl.value === 'FIRST_HALF' ||
        this.uploadedCards[0].periodHintControl.value === 'SECOND_HALF'
      ) {
        return;
      }
      this.uploadedCards[0].periodHintControl.setValue('AUTO');
      return;
    }

    if (this.uploadedCards.length === 2) {
      if (this.uploadedCards[0].periodHintControl.value === 'AUTO') {
        this.uploadedCards[0].periodHintControl.setValue('FIRST_HALF');
      }
      if (this.uploadedCards[1].periodHintControl.value === 'AUTO') {
        this.uploadedCards[1].periodHintControl.setValue('SECOND_HALF');
      }
    }
  }

  private applyGeminiRows(
    rows: Map<
      number,
      TimesheetDay & { sourceFileName: string; periodHint: string }
    >,
  ): void {
    for (const row of this.days.controls) {
      const extracted = rows.get(row.controls.day.value);

      if (!extracted) {
        row.patchValue(
          {
            status: 'UNKNOWN',
            confidence: null,
            remarks: 'No Gemini row detected',
          },
          { emitEvent: false },
        );
        continue;
      }

      const total = this.roundHours(Number(extracted.totalHours || 0));
      const basic = this.roundHours(
        Number.isFinite(Number(extracted.basicHours))
          ? Number(extracted.basicHours)
          : Math.min(8, total),
      );
      const overtime = this.roundHours(
        Number.isFinite(Number(extracted.overtimeHours))
          ? Number(extracted.overtimeHours)
          : Math.max(0, total - basic),
      );

      row.patchValue(
        {
          startTime: extracted.startTime,
          endTime: extracted.endTime,
          basicHours: basic,
          overtimeHours: overtime,
          totalHours: total,
          confidence: extracted.confidence,
          remarks: extracted.remarks,
          status: extracted.status,
          sourceFileName: extracted.sourceFileName,
          periodHint: extracted.periodHint,
        },
        { emitEvent: false },
      );
    }
  }

  private async loadRateForSelection(): Promise<void> {
    const worker = this.form.controls.worker.value;
    const site = this.form.controls.projectSite.value;

    if (!worker || !site) {
      this.rateStatus = 'idle';
      return;
    }

    this.rateStatus = 'loading';

    try {
      const response = await firstValueFrom(
        this.http.fetchWorkerProjectRate(worker.entityId, site.id),
      );

      if (response.error) {
        this.rateStatus = 'error';
        return;
      }

      const rate = response.data as WorkerProjectRate | null;
      if (rate) {
        this.form.controls.workerRate.setValue(
          Number(rate.rate_per_hour),
          { emitEvent: false },
        );
        this.rateStatus = 'loaded';
      } else {
        this.form.controls.workerRate.setValue(null, { emitEvent: false });
        this.rateStatus = 'missing';
      }
    } catch (error) {
      console.error('Unable to load worker project rate', error);
      this.rateStatus = 'error';
    }
  }

  private async loadRecordById(id: string): Promise<void> {
    this.isLoadingSaved = true;

    try {
      const response = await firstValueFrom(
        this.http.fetchMonthlyWorkerTimesheetById(id),
      );

      if (response.error) {
        throw new Error(response.error.message ?? 'Unable to load timesheet.');
      }

      const record = response.data as MonthlyWorkerTimesheet | null;
      if (!record) {
        throw new Error('The requested timesheet record was not found.');
      }

      this.applySavedRecord(record);
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to open record',
        detail:
          error instanceof Error
            ? error.message
            : 'Could not open the requested timesheet.',
      });
    } finally {
      this.isLoadingSaved = false;
    }
  }

  private applySavedRecord(record: MonthlyWorkerTimesheet): void {
    const worker =
      this.workers.find(
        (item) => item.entityId === record.employee_entity_id,
      ) ?? null;
    const site =
      this.projectSites.find((item) => item.id === record.project_site_id) ??
      null;
    const month = new Date(record.work_year, record.work_month - 1, 1);

    this.isApplyingLoadedRecord = true;
    this.form.patchValue(
      {
        worker,
        projectSite: site,
        monthYear: month,
        workerRate: Number(record.worker_rate),
        notes: record.notes ?? '',
      },
      { emitEvent: false },
    );
    this.buildMonthRows(month);

    const byDay = new Map(
      (record.daily_entries ?? []).map((entry) => [entry.day, entry]),
    );

    for (const row of this.days.controls) {
      const saved = byDay.get(row.controls.day.value);
      if (!saved) continue;

      row.patchValue(
        {
          startTime: saved.startTime,
          endTime: saved.endTime,
          basicHours: Number(saved.basicHours || 0),
          overtimeHours: Number(saved.overtimeHours || 0),
          totalHours: Number(saved.totalHours || 0),
          confidence:
            saved.confidence === null || saved.confidence === undefined
              ? null
              : Number(saved.confidence),
          remarks: saved.remarks ?? null,
          status: saved.status,
          sourceFileName: saved.sourceFileName ?? null,
          periodHint: saved.periodHint ?? null,
        },
        { emitEvent: false },
      );
    }

    this.existingRecordId = record.id ?? null;
    this.loadedSourceFiles = record.source_files ?? [];
    this.hasExtractionRun = true;
    this.rateStatus = 'loaded';
    this.isApplyingLoadedRecord = false;
  }

  private get currentSourceFiles(): Array<{
    name: string;
    size: number;
    periodHint: string;
  }> {
    if (this.uploadedCards.length) {
      return this.uploadedCards.map((card) => ({
        name: card.file.name,
        size: card.file.size,
        periodHint: card.periodHintControl.value,
      }));
    }

    return this.loadedSourceFiles;
  }

  private buildPayload(): MonthlyWorkerTimesheet {
    const worker = this.form.controls.worker.value!;
    const site = this.form.controls.projectSite.value!;
    const month = this.form.controls.monthYear.value!;
    const year = month.getFullYear();
    const monthNumber = month.getMonth() + 1;

    return {
      ...(this.existingRecordId ? { id: this.existingRecordId } : {}),
      employee_entity_id: worker.entityId,
      employee_name: worker.name,
      identifier_number: worker.identifierNumber ?? null,
      project_site_id: site.id,
      project_site_name: site.projectSiteName,
      site_owner: site.siteOwner ?? null,
      work_year: year,
      work_month: monthNumber,
      period_start: this.formatDate(new Date(year, monthNumber - 1, 1)),
      period_end: this.formatDate(new Date(year, monthNumber, 0)),
      total_basic_hours: this.totalBasicHours,
      total_overtime_hours: this.totalOvertimeHours,
      total_hours: this.totalHours,
      days_worked: this.daysWorked,
      worker_rate: this.workerRate,
      total_amount: this.totalAmount,
      review_count: this.reviewCount,
      gemini_model: this.geminiService.modelName,
      source_count: this.currentSourceFiles.length,
      source_files: this.currentSourceFiles,
      daily_entries: this.days.controls.map((row) => this.rowToEntry(row)),
      notes: this.form.controls.notes.value?.trim() || null,
      is_finalized: this.reviewCount === 0,
    };
  }

  private rowToEntry(row: DayFormGroup): MonthlyTimesheetDayEntry {
    return {
      day: row.controls.day.value,
      date: row.controls.date.value,
      startTime: row.controls.startTime.value?.trim() || null,
      endTime: row.controls.endTime.value?.trim() || null,
      basicHours: Number(row.controls.basicHours.value || 0),
      overtimeHours: Number(row.controls.overtimeHours.value || 0),
      totalHours: Number(row.controls.totalHours.value || 0),
      confidence: row.controls.confidence.value,
      remarks: row.controls.remarks.value?.trim() || null,
      status: row.controls.status.value,
      sourceFileName: row.controls.sourceFileName.value,
      periodHint: row.controls.periodHint.value,
    };
  }

  private validateHeader(requireRate: boolean): boolean {
    const controls = this.form.controls;

    controls.worker.markAsTouched();
    controls.projectSite.markAsTouched();
    controls.monthYear.markAsTouched();
    if (requireRate) controls.workerRate.markAsTouched();

    if (
      controls.worker.invalid ||
      controls.projectSite.invalid ||
      controls.monthYear.invalid ||
      (requireRate && controls.workerRate.invalid)
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Complete timesheet details',
        detail: requireRate
          ? 'Select worker, project, month and enter a valid worker rate.'
          : 'Select worker, project and month before continuing.',
      });
      return false;
    }

    return true;
  }

  private resetRecordIdentity(): void {
    this.existingRecordId = null;
    this.loadedSourceFiles = [];
    this.hasExtractionRun = false;
  }

  private buildMonthRows(month: Date | null): void {
    if (!month) return;

    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    this.days.clear();

    for (let day = 1; day <= daysInMonth; day++) {
      this.days.push(
        this.fb.group({
          day: this.fb.control(day, { nonNullable: true }),
          date: this.fb.control(
            this.formatDate(new Date(year, monthIndex, day)),
            { nonNullable: true },
          ),
          startTime: this.fb.control<string | null>(null),
          endTime: this.fb.control<string | null>(null),
          basicHours: this.fb.control(0, { nonNullable: true }),
          overtimeHours: this.fb.control(0, { nonNullable: true }),
          totalHours: this.fb.control(0, { nonNullable: true }),
          confidence: this.fb.control<number | null>(null),
          remarks: this.fb.control<string | null>(null),
          status: this.fb.control<MonthlyTimesheetDayStatus>('UNKNOWN', {
            nonNullable: true,
          }),
          sourceFileName: this.fb.control<string | null>(null),
          periodHint: this.fb.control<string | null>(null),
        }),
      );
    }
  }

  private parseTimeToHours(value: string | null): number | null {
    if (!value?.trim()) return null;

    const normalized = value.trim().toLowerCase();
    const match = normalized.match(
      /^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/,
    );
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    const meridiem = match[3];

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    if (hours > 24) return null;

    return hours + minutes / 60;
  }

  private async createPdf(): Promise<import('jspdf').jsPDF> {
    const element = this.timesheetDocument?.nativeElement;

    if (!element) {
      throw new Error('Timesheet preview is not available.');
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

  private previousMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private roundHours(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
