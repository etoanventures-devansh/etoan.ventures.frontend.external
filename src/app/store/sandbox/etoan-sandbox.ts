import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as EtoanActions from '../actions/etoan-actions';
import * as StateSelectors from '../index';
import { API_FAILURE_TYPES, EmployeeDetails, EmployeeSalaryRate, PreviousTimecards, ProjectSites } from '../../models/etoan-models';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class EtoanSandboxService {
    employeeDetails$: Observable<EmployeeDetails[] | null>;
    projectSites$: Observable<ProjectSites[] | null>;
    previousTimecards$: Observable<PreviousTimecards[] | null>;
    failure$: Observable<{concern: API_FAILURE_TYPES, error: any} | null>; 
    loading$: Observable<boolean>;
    employeeSalaryRate$: Observable<EmployeeSalaryRate[] | null>
    constructor(private store: Store) {
        this.employeeDetails$ = this.store.select(StateSelectors.employeeDetails);
        this.projectSites$ = this.store.select(StateSelectors.projectSites);
        this.previousTimecards$ = this.store.select(StateSelectors.previousTimecards);
        this.failure$ = this.store.select(StateSelectors.failure);
        this.loading$ = this.store.select(StateSelectors.loading);
        this.employeeSalaryRate$ = this.store.select(StateSelectors.employeeSalaryRate)
    }
  
  getEmployeeDetails(){
    this.store.dispatch(EtoanActions.getEmployeeDetails())
  }

  getProjectSites() {
    this.store.dispatch(EtoanActions.getProjectSites())
  }

  getPreviousTimecards(entityId: string){
    this.store.dispatch(EtoanActions.getPreviousTimecards({entityId: entityId}))
  }

  getEmployeeSalaryRates(){
    this.store.dispatch(EtoanActions.getEmployeeSalaryRate())
  }

  resetTimeCards(){
    this.store.dispatch(EtoanActions.resetTimecards())
  }

  setIsLoading(isLoading: boolean){
    this.store.dispatch(EtoanActions.setIsLoading({isLoading}))
  }

}
