import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { EmployeeAttendance, EmployeeDetails } from '../../models/etoan-models';
import { EtoanHttpService } from '../../services/etoan-http-service.service';

interface AttendanceViewRow {
  employee: EmployeeDetails;
  attendance: EmployeeAttendance | null;
}

@Component({
  selector: 'app-attendance-records',
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    DatePickerModule,
    InputTextModule,
    MessageModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './attendance-records.component.html',
  styleUrl: './attendance-records.component.scss',
})
export class AttendanceRecordsComponent implements OnInit {
  selectedDate = new Date();
  searchText = '';
  rows: AttendanceViewRow[] = [];
  filteredRows: AttendanceViewRow[] = [];
  loading = false;
  errorMessage = '';

  constructor(private etoanHttp: EtoanHttpService) {}

  ngOnInit(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.loading = true;
    this.errorMessage = '';
    const date = this.toDateString(this.selectedDate);

    forkJoin({
      employeesResponse: this.etoanHttp.fetchAttendanceViewEmployees(),
      attendanceResponse: this.etoanHttp.fetchAttendanceByDate(date),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(({ employeesResponse, attendanceResponse }) => {
        if (employeesResponse.error || attendanceResponse.error) {
          this.errorMessage = 'Unable to load attendance. Please try again.';
          return;
        }

        const employees: EmployeeDetails[] = (employeesResponse.data ?? [])
          .filter((employee: EmployeeDetails) =>
            !employee.status || employee.status.toUpperCase() === 'ACTIVE',
          )
          .sort((a: EmployeeDetails, b: EmployeeDetails) =>
            (a.name || '').localeCompare(b.name || ''),
          );

        const attendanceByEmployee = new Map<string, EmployeeAttendance>(
          (attendanceResponse.data ?? []).map((record: EmployeeAttendance) => [
            record.employeeId,
            record,
          ]),
        );

        this.rows = employees.map((employee) => ({
          employee,
          attendance: attendanceByEmployee.get(employee.entityId) ?? null,
        }));

        this.applyFilters();
      });
  }

  onDateChanged(): void {
    if (!this.selectedDate) return;
    this.loadAttendance();
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredRows = this.rows.filter(({ employee }) => {
      if (!search) return true;

      return (
        employee.name?.toLowerCase().includes(search) ||
        employee.identifierNumber?.toLowerCase().includes(search) ||
        employee.designation?.toLowerCase().includes(search)
      );
    });
  }

  get presentCount(): number {
    return this.rows.filter((row) => !!row.attendance).length;
  }

  get notSubmittedCount(): number {
    return this.rows.length - this.presentCount;
  }

  get attendanceRate(): number {
    if (!this.rows.length) return 0;
    return Math.round((this.presentCount / this.rows.length) * 100);
  }

  maskIdentifier(value?: string): string {
    if (!value) return '-';
    if (value.length <= 4) return value;
    return `${'X'.repeat(value.length - 4)}${value.slice(-4)}`;
  }

  private toDateString(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
