import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as EtoanActions from '../actions/etoan-actions';
import * as StateSelectors from '../index';
import { API_FAILURE_TYPES, EmployeeDetails, ProjectSites } from '../../models/etoan-models';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class EtoanSandboxService {
    employeeDetails$: Observable<EmployeeDetails[] | null>;
    projectSites$: Observable<ProjectSites[] | null>;
    failure$: Observable<{concern: API_FAILURE_TYPES, error: any} | null>; 
    loading$: Observable<boolean>;
    constructor(private store: Store) {
        this.employeeDetails$ = this.store.select(StateSelectors.employeeDetails);
        this.projectSites$ = this.store.select(StateSelectors.projectSites);
        this.failure$ = this.store.select(StateSelectors.failure);
        this.loading$ = this.store.select(StateSelectors.loading)
    }
  
  getEmployeeDetails(){
    this.store.dispatch(EtoanActions.getEmployeeDetails())
  }

  getProjectSites() {
    this.store.dispatch(EtoanActions.getProjectSites())
  }
}
