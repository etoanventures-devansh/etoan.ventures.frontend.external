import { Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { from, Observable, of } from 'rxjs';
import { TABLE_NAMES } from '../constants/table-name';
import { PreviousTimecards, TimecardEntry } from '../models/etoan-models';

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
        .order('created_at', { ascending: false })
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
}
