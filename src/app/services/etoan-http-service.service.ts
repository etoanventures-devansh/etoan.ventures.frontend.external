import { Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { from, Observable, of } from 'rxjs';
import { TABLE_NAMES } from '../constants/table-name';
import { EmployeeSalaryRecords, PreviousTimecards, TimecardEntry } from '../models/etoan-models';

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
}
