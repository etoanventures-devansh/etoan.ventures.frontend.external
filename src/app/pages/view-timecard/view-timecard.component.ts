import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DatePipe, NgFor, NgIf } from '@angular/common';
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
    NgFor,
    NgIf,
    DatePipe
  ],
  templateUrl: './view-timecard.component.html',
  styleUrl: './view-timecard.component.scss'
})
export class ViewTimecardComponent {
  timecards: TimecardView[] = [];
  filteredTimecards: TimecardView[] = [];
  workerList: EmployeeDetails[] | null = []

  searchForm = new FormBuilder().group({
    searchText: ['']
  });

  constructor(private sandbox: EtoanSandboxService) {}

  ngOnInit(): void {
    this.sandbox.getEmployeeDetails();
    this.initSubscriptions()
    // Replace this with Supabase data later
    this.timecards = [
      {
        id: 1,
        date: '2026-05-04',
        employeeName: 'Rajangam Ramar',
        identifierNumber: 'G1234567X',
        projectSite: 'Tampines Site A',
        startTime: '2026-05-04T08:00:00',
        endTime: '2026-05-04T17:00:00',
        totalHours: 8,
        normalHours: 8,
        overTimeHours: 0,
        totalBreakHours: 1,
        lunchTimeWork: false
      },
      {
        id: 1,
        date: '2026-05-04',
        employeeName: 'Rajangam Ramar',
        identifierNumber: 'G1234567X',
        projectSite: 'Tampines Site A',
        startTime: '2026-05-04T08:00:00',
        endTime: '2026-05-04T17:00:00',
        totalHours: 8,
        normalHours: 8,
        overTimeHours: 0,
        totalBreakHours: 1,
        lunchTimeWork: false
      }
    ];
  }

  initSubscriptions(){
    this.sandbox.employeeDetails$.subscribe((workerList) => {
      this.workerList = workerList
    })
    this.sandbox.previousTimecards$.subscribe((timecards) => {
      this.filteredTimecards = [];
      if(timecards?.length){
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
    const searchText = this.searchForm.value.searchText?.toUpperCase().trim();
    const refEntityId = this.workerList?.find((worker) => worker.identifierNumber?.slice(-4) === searchText)?.entityId
    if(refEntityId) this.sandbox.getPreviousTimecards(refEntityId)
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.filteredTimecards = [];
  }

  maskLast4(value: string): string {
    if (!value) return '';
    if (value.length <= 4) return value;
    return 'X'.repeat(value.length - 4) + value.slice(-4);
  }
}