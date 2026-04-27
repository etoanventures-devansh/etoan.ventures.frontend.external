import { Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { from, Observable, of } from 'rxjs';
import { TABLE_NAMES } from '../constants/table-name';

@Injectable({
  providedIn: 'root'
})
export class EtoanHttpService {

  constructor(private supabaseClient: SupabaseClientService) { }

  fetchEmployeeDetails(): Observable<any>{
    return from(this.supabaseClient.client.from(TABLE_NAMES.EMPLOYEE_DETAILS).select('*'))
  }
  fetchProjectSites(): Observable<any> {
    return from(this.supabaseClient.client.from(TABLE_NAMES.PROJECT_SITES).select('*'))
  }
}
