import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import { EmployeeDetails } from '../../models/etoan-models';
import { EtoanHttpService } from '../../services/etoan-http-service.service';

@Component({
  selector: 'app-attendance-entry',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './attendance-entry.component.html',
  styleUrl: './attendance-entry.component.scss',
})
export class AttendanceEntryComponent implements OnInit {
  employees: EmployeeDetails[] = [];
  selectedEmployeeId: string | null = null;
  today = new Date();
  loadingEmployees = false;
  submitting = false;
  checkingAttendance = false;
  alreadySubmitted = false;
  submittedAt: string | null = null;
  errorMessage = '';

  constructor(
    private etoanHttp: EtoanHttpService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loadingEmployees = true;
    this.errorMessage = '';

    this.etoanHttp
      .fetchAttendanceEntryEmployees()
      .pipe(finalize(() => (this.loadingEmployees = false)))
      .subscribe(({ data, error }) => {
        if (error) {
          this.errorMessage = 'Unable to load the worker list. Please try again.';
          return;
        }

        this.employees = (data ?? [])
          .filter((employee: EmployeeDetails) =>
            !employee.status || employee.status.toUpperCase() === 'ACTIVE',
          )
          .sort((a: EmployeeDetails, b: EmployeeDetails) =>
            (a.name || '').localeCompare(b.name || ''),
          );
      });
  }

  onEmployeeChanged(): void {
    this.alreadySubmitted = false;
    this.submittedAt = null;
    this.errorMessage = '';

    if (!this.selectedEmployeeId) return;

    this.checkingAttendance = true;
    this.etoanHttp
      .fetchEmployeeAttendance(this.selectedEmployeeId, this.getTodayDateString())
      .pipe(finalize(() => (this.checkingAttendance = false)))
      .subscribe(({ data, error }) => {
        if (error) {
          this.errorMessage = 'Unable to check today\'s attendance. Please try again.';
          return;
        }

        const record = data?.[0];
        this.alreadySubmitted = !!record;
        this.submittedAt = record?.submittedAt ?? null;
      });
  }

  submitAttendance(): void {
    if (!this.selectedEmployeeId || this.submitting || this.alreadySubmitted) return;

    this.submitting = true;
    this.errorMessage = '';

    this.etoanHttp
      .postEmployeeAttendance(this.selectedEmployeeId)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe(({ data, error }) => {
        if (error) {
          if (error.code === '23505') {
            this.alreadySubmitted = true;
            this.messageService.add({
              severity: 'info',
              summary: 'Already submitted',
              detail: 'Your attendance has already been recorded for today.',
            });
            return;
          }

          this.errorMessage = 'Unable to submit attendance. Please try again.';
          return;
        }

        const record = data?.[0];
        this.alreadySubmitted = true;
        this.submittedAt = record?.submittedAt ?? new Date().toISOString();
        this.messageService.add({
          severity: 'success',
          summary: 'Attendance recorded',
          detail: 'Your attendance for today has been submitted successfully.',
        });
      });
  }

  get selectedEmployee(): EmployeeDetails | undefined {
    return this.employees.find(
      (employee) => employee.entityId === this.selectedEmployeeId,
    );
  }

  private getTodayDateString(): string {
    const year = this.today.getFullYear();
    const month = String(this.today.getMonth() + 1).padStart(2, '0');
    const day = String(this.today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
