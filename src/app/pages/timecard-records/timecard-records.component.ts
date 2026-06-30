import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, tap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';

import { PreviousTimecards } from '../../models/etoan-models';
import { EtoanHttpService } from '../../services/etoan-http-service.service';
import { EtoanSandboxService } from '../../store/sandbox/etoan-sandbox';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-timecard-records',
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    CardModule,
    TagModule,
    TableModule,
    MessageModule,
  ],
  templateUrl: './timecard-records.component.html',
  styleUrl: './timecard-records.component.scss',
})
export class TimecardRecordsComponent implements OnInit {
  records: PreviousTimecards[] = [];
  filteredRecords: PreviousTimecards[] = [];

  searchText = '';
  selectedWorker: string | null = null;
  selectedProject: string | null = null;
  dateRange: Date[] | null = null;

  workerOptions: FilterOption[] = [];
  projectOptions: FilterOption[] = [];

  loading = false;
  errorMessage = '';

  constructor(private etoanHttp: EtoanHttpService, private sandbox: EtoanSandboxService) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.errorMessage = '';

    this.etoanHttp
      .fetchTimecardRecords()
      .pipe(tap(()=> this.sandbox.setIsLoading(true)),finalize(() => this.sandbox.setIsLoading(false)))
      .subscribe(({ data, error }) => {
        if (error) {
          this.errorMessage = 'Unable to load timecard records. Please try again.';
          return;
        }

        this.records = data ?? [];
        this.filteredRecords = [...this.records];
        this.buildFilterOptions();
      });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();
    const [startDate, endDate] = this.dateRange ?? [];

    this.filteredRecords = this.records.filter((record) => {
      const matchesSearch =
        !search ||
        record.employeeName?.toLowerCase().includes(search) ||
        record.identifierNumber?.toLowerCase().includes(search) ||
        record.projectSite?.toLowerCase().includes(search);

      const matchesWorker =
        !this.selectedWorker || record.employeeName === this.selectedWorker;

      const matchesProject =
        !this.selectedProject || record.projectSite === this.selectedProject;

      const recordDate = this.toDateOnly(record.date);
      const matchesDateRange =
        !startDate ||
        !endDate ||
        (recordDate >= this.toDateOnly(startDate) &&
          recordDate <= this.toDateOnly(endDate));

      return matchesSearch && matchesWorker && matchesProject && matchesDateRange;
    });
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedWorker = null;
    this.selectedProject = null;
    this.dateRange = null;
    this.filteredRecords = [...this.records];
  }

  get totalNormalHours(): number {
    return this.filteredRecords.reduce(
      (total, record) => total + Number(record.normalHours || 0),
      0,
    );
  }

  get totalOvertimeHours(): number {
    return this.filteredRecords.reduce(
      (total, record) => total + Number(record.overTimeHours || 0),
      0,
    );
  }

  get totalHours(): number {
    return this.filteredRecords.reduce(
      (total, record) => total + Number(record.totalHours || 0),
      0,
    );
  }

  getWorkType(record: PreviousTimecards): 'success' | 'warn' {
    return Number(record.overTimeHours || 0) > 0 ? 'warn' : 'success';
  }

  maskIdentifier(value: string): string {
    if (!value) return '-';
    if (value.length <= 4) return value;
    return `${'X'.repeat(value.length - 4)}${value.slice(-4)}`;
  }

  private buildFilterOptions(): void {
    this.workerOptions = this.getUniqueOptions('employeeName');
    this.projectOptions = this.getUniqueOptions('projectSite');
  }

  private getUniqueOptions(key: 'employeeName' | 'projectSite'): FilterOption[] {
    return [...new Set(this.records.map((record) => record[key]).filter(Boolean))]
      .sort()
      .map((value) => ({ label: value, value }));
  }

  private toDateOnly(value: string | Date): Date {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
