import { Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { from, Observable, of } from 'rxjs';
import { TABLE_NAMES } from '../constants/table-name';
import { EmployeeAttendance, EmployeeSalaryRecords, MonthlyWorkerTimesheet, PreviousTimecards, TimecardEntry, WorkerProjectRate } from '../models/etoan-models';

@Injectable({
  providedIn: 'root',
})
export class EtoanHttpService {
  constructor(private supabaseClient: SupabaseClientService) {}

  fetchEmployeeDetails(): Observable<any> {
    return from(
      this.supabaseClient.client.from(TABLE_NAMES.EMPLOYEE_DETAILS).select('*'),
    );
  }

  fetchAttendanceEntryEmployees(): Observable<any> {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.EMPLOYEE_DETAILS)
        .select('entityId,name,status'),
    );
  }

  fetchAttendanceViewEmployees(): Observable<any> {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.EMPLOYEE_DETAILS)
        .select('entityId,name,identifierNumber,designation,status'),
    );
  }
  fetchProjectSites(): Observable<any> {
    return from(
      this.supabaseClient.client.from(TABLE_NAMES.PROJECT_SITES).select('*'),
    );
  }

  fetchPreviousTimeCards(entityId: string) {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.TIMECARD_ENTRY)
        .select('*')
        .eq('refEntityId', entityId)
        .order('date', { ascending: false })
        .limit(5),
    );
  }
  postSaveTimeCard(payload: TimecardEntry): Observable<any> {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.TIMECARD_ENTRY)
        .insert(payload),
    );
  }

  fetchTimecardRecords() {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.TIMECARD_ENTRY)
        .select('*')
        .order('date', { ascending: false })
        .order('employeeName', { ascending: true }),
    );
  }

  fetchEmployeeAttendance(employeeId: string, attendanceDate: string) {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.EMPLOYEE_ATTENDANCE)
        .select('*')
        .eq('employeeId', employeeId)
        .eq('attendanceDate', attendanceDate)
        .limit(1),
    );
  }

  fetchAttendanceByDate(attendanceDate: string) {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.EMPLOYEE_ATTENDANCE)
        .select('*')
        .eq('attendanceDate', attendanceDate)
        .order('submittedAt', { ascending: true }),
    );
  }

  postEmployeeAttendance(employeeId: string) {
    const payload: EmployeeAttendance = { employeeId };

    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.EMPLOYEE_ATTENDANCE)
        .insert(payload)
        .select(),
    );
  }

  fetchEmployeeSalaryRates() {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.EMPLOYEE_SALARY_RATE)
        .select('*'),
    );
  }

  fetchEmployeeSalaryRecords() {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.EMPLOYEE_SALARY_RECORDS)
        .select('*'),
    );
  }

  postSaveSalaryEntry(payload: EmployeeSalaryRecords){
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.EMPLOYEE_SALARY_RECORDS)
        .insert(payload),
    );
  }

  fetchWorkerProjectRate(employeeEntityId: string, projectSiteId: number) {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.WORKER_PROJECT_RATES)
        .select('*')
        .eq('employee_entity_id', employeeEntityId)
        .eq('project_site_id', projectSiteId)
        .eq('is_active', true)
        .maybeSingle(),
    );
  }

  upsertWorkerProjectRate(payload: WorkerProjectRate) {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.WORKER_PROJECT_RATES)
        .upsert(payload, {
          onConflict: 'employee_entity_id,project_site_id',
        })
        .select(),
    );
  }

  fetchMonthlyWorkerTimesheet(
    employeeEntityId: string,
    projectSiteId: number,
    year: number,
    month: number,
  ) {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.MONTHLY_WORKER_TIMESHEETS)
        .select('*')
        .eq('employee_entity_id', employeeEntityId)
        .eq('project_site_id', projectSiteId)
        .eq('work_year', year)
        .eq('work_month', month)
        .limit(1),
    );
  }

  fetchMonthlyWorkerTimesheetById(id: string) {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.MONTHLY_WORKER_TIMESHEETS)
        .select('*')
        .eq('id', id)
        .maybeSingle(),
    );
  }

  fetchMonthlyWorkerTimesheets() {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.MONTHLY_WORKER_TIMESHEETS)
        .select('*')
        .order('work_year', { ascending: false })
        .order('work_month', { ascending: false })
        .order('employee_name', { ascending: true }),
    );
  }

  upsertMonthlyWorkerTimesheet(payload: MonthlyWorkerTimesheet) {
    return from(
      this.supabaseClient.client
        .from(TABLE_NAMES.MONTHLY_WORKER_TIMESHEETS)
        .upsert(payload, {
          onConflict: 'employee_entity_id,project_site_id,work_year,work_month',
        })
        .select(),
    );
  }

}
