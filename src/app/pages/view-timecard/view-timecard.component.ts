import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { EtoanSandboxService } from '../../store/sandbox/etoan-sandbox';
import { EmployeeDetails } from '../../models/etoan-models';

interface TimecardView {
  id: number;
  date: string;
  employeeName: string;
  identifierNumber: string;
  projectSite: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  normalHours: number;
  overTimeHours: number;
  totalBreakHours: number;
  lunchTimeWork: boolean;
}

@Component({
  selector: 'app-view-timecard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    MessageModule,
    DatePipe,
    CommonModule
  ],
  templateUrl: './view-timecard.component.html',
  styleUrl: './view-timecard.component.scss'
})
export class ViewTimecardComponent {
  timecards: TimecardView[] = [];
  filteredTimecards: TimecardView[] = [];
  workerList: EmployeeDetails[] | null = []

  searchForm = new FormBuilder().group({
    searchText: [{ value: '', disabled: false }, [Validators.required, this.nricLast4Validator()]]
  });

  constructor(private sandbox: EtoanSandboxService) {}

  ngOnInit(): void {
    this.sandbox.getEmployeeDetails();
    this.initSubscriptions()
   
  }

  ngOnDestroy(){
    this.filteredTimecards = [];
  }

  initSubscriptions(){
    this.sandbox.employeeDetails$.subscribe((workerList) => {
      this.workerList = workerList
    })
    this.sandbox.previousTimecards$.subscribe((timecards) => {
      this.filteredTimecards = [];
      if(timecards?.length){

        this.searchForm.get('searchText')?.disable()
        timecards.forEach((card) => {
          this.filteredTimecards.push({
            id: card.id,
            employeeName: card.employeeName,
            date: card.date,
            startTime: card.startTime,
            endTime: card.endTime,
            identifierNumber: card.identifierNumber,
            lunchTimeWork: card.lunchTimeWork,
            projectSite: card.projectSite,
            normalHours: card.normalHours,
            overTimeHours: card.overTimeHours,
            totalBreakHours: card.totalBreakHours,
            totalHours: card.totalHours

          })
        })
      }
    })
  }

  searchTimecards(): void {
    if(this.searchForm.invalid){
      this.searchForm.markAllAsTouched();
      return;
    }
    const searchText = this.searchForm.get('searchText')?.value?.toUpperCase().trim();
    const refEntityId = this.workerList?.find((worker) => worker.identifierNumber?.slice(-4) === searchText)?.entityId
    this.sandbox.getPreviousTimecards(refEntityId || '')
  }

  clearSearch(): void {
    this.searchForm.get('searchText')?.enable()
    this.searchForm.reset();
    this.filteredTimecards = [];
  }

  maskLast4(value: string): string {
    if (!value) return '';
    if (value.length <= 4) return value;
    return 'X'.repeat(value.length - 4) + value.slice(-4);
  }

  nricLast4Validator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').toUpperCase().trim();

    if (!value) return null; // let required handle empty value

    const refEntityId = this.workerList?.find((worker) => worker.identifierNumber?.slice(-4) === value)?.entityId


    return refEntityId
      ? null
      : { nricLast4Mismatch: true };
  };
}
}