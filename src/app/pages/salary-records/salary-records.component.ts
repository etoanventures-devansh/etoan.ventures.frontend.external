import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { EmployeeSalaryRecords } from '../../models/etoan-models';
import { EtoanSandboxService } from '../../store/sandbox/etoan-sandbox';
import { EtoanPayslipComponent } from './etoan-payslip/etoan-payslip.component';

interface FilterOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-salary-records',
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    EtoanPayslipComponent,
  ],
  templateUrl: './salary-records.component.html',
  styleUrl: './salary-records.component.scss',
})
export class SalaryRecordsComponent implements OnInit {
  records: EmployeeSalaryRecords[] = [];
  filteredRecords: EmployeeSalaryRecords[] = [];

  searchText = '';
  selectedWorker: string | null = null;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;
  paymentDateRange: Date[] | null = null;

  workerOptions: FilterOption[] = [];
  monthOptions: FilterOption[] = [
    { label: 'Jan', value: 1 },
    { label: 'Feb', value: 2 },
    { label: 'Mar', value: 3 },
    { label: 'Apr', value: 4 },
    { label: 'May', value: 5 },
    { label: 'Jun', value: 6 },
    { label: 'Jul', value: 7 },
    { label: 'Aug', value: 8 },
    { label: 'Sep', value: 9 },
    { label: 'Oct', value: 10 },
    { label: 'Nov', value: 11 },
    { label: 'Dec', value: 12 },
  ];
  yearOptions: FilterOption[] = [];

  loading = false;
  errorMessage = '';
  selectedRecord: EmployeeSalaryRecords | null = null;
  payslipVisible = false;

  constructor(private sandbox: EtoanSandboxService) {}

  ngOnInit(): void {
    this.loadRecords();

    this.sandbox.loading$.subscribe((loading) => {
      this.loading = loading;
    });

    this.sandbox.employeeSalaryRecords$.subscribe((records) => {
      this.records = records ?? [];
      this.filteredRecords = [...this.records];
      this.buildFilterOptions();
      this.applyFilters();
    });

    this.sandbox.failure$.subscribe((failure) => {
      this.errorMessage =
        failure?.concern === 'getEmployeeSalaryRecords'
          ? 'Unable to load salary records. Please try again.'
          : '';
    });
  }

  loadRecords(): void {
    this.sandbox.getEmployeeSalaryRecords();
  }

  openPayslip(record: EmployeeSalaryRecords): void {
    this.selectedRecord = record;
    this.payslipVisible = true;
  }

  onPayslipClosed(): void {
    this.selectedRecord = null;
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();
    const [startDate, endDate] = this.paymentDateRange ?? [];

    this.filteredRecords = this.records.filter((record) => {
      const matchesSearch =
        !search ||
        record.employee_name?.toLowerCase().includes(search) ||
        record.identifier_number?.toLowerCase().includes(search) ||
        record.designation?.toLowerCase().includes(search) ||
        record.payment_mode?.toLowerCase().includes(search);

      const matchesWorker =
        !this.selectedWorker || record.employee_name === this.selectedWorker;

      const matchesMonth =
        !this.selectedMonth || Number(record.salary_month) === Number(this.selectedMonth);

      const matchesYear =
        !this.selectedYear || Number(record.salary_year) === Number(this.selectedYear);

      const paymentDate = this.toDateOnly(record.payment_date);
      const matchesPaymentDate =
        !startDate ||
        !endDate ||
        (paymentDate >= this.toDateOnly(startDate) &&
          paymentDate <= this.toDateOnly(endDate));

      return (
        matchesSearch &&
        matchesWorker &&
        matchesMonth &&
        matchesYear &&
        matchesPaymentDate
      );
    });
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedWorker = null;
    this.selectedMonth = null;
    this.selectedYear = null;
    this.paymentDateRange = null;
    this.filteredRecords = [...this.records];
  }

  get totalGrossSalary(): number {
    return this.sumBy('gross_salary');
  }

  get totalNetSalary(): number {
    return this.sumBy('net_salary');
  }

  get totalDeductions(): number {
    return this.sumBy('total_deduction');
  }

  get totalOvertimePay(): number {
    return this.sumBy('total_overtime_pay');
  }

  getRecordSeverity(record: EmployeeSalaryRecords): 'success' | 'info' | 'warn' {
    if (Number(record.net_salary || 0) <= 0) return 'warn';
    if (Number(record.total_deduction || 0) > 0) return 'info';
    return 'success';
  }

  formatMonth(month: number): string {
    return this.monthOptions.find((option) => option.value === Number(month))?.label ?? '-';
  }

  maskIdentifier(value?: string): string {
    if (!value) return '-';
    if (value.length <= 4) return value;
    return `${'X'.repeat(value.length - 4)}${value.slice(-4)}`;
  }

  private buildFilterOptions(): void {
    this.workerOptions = [...new Set(this.records.map((record) => record.employee_name).filter(Boolean))]
      .sort()
      .map((value) => ({ label: value, value }));

    this.yearOptions = [...new Set(this.records.map((record) => record.salary_year).filter(Boolean))]
      .sort((a, b) => Number(b) - Number(a))
      .map((value) => ({ label: String(value), value }));
  }

  private sumBy(key: keyof EmployeeSalaryRecords): number {
    return this.filteredRecords.reduce(
      (total, record) => total + Number(record[key] || 0),
      0,
    );
  }

  private toDateOnly(value: string | Date): Date {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
