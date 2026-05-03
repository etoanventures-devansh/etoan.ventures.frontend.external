import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { EtoanSandboxService } from '../../store/sandbox/etoan-sandbox';
import { combineLatest, filter } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EtoanHttpService } from '../../services/etoan-http-service.service';
import { TimecardEntry } from '../../models/etoan-models';

@Component({
  selector: 'app-timecard-entry',
  imports: [
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    CardModule,
    DialogModule,
    CheckboxModule,
    TagModule,
    TableModule,
    CalendarModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './timecard-entry.component.html',
  styleUrl: './timecard-entry.component.scss',
})
export class TimecardEntryComponent implements OnInit {
  workerList: { name: string; code: string }[] = [];
  projectList: { name: string; code: number }[] = [];
  refEntityIdList: {code: string; refEntityId: string}[] = [];
  startTime = new Date(new Date().setHours(8, 0, 0, 0));
  endTime = new Date(new Date().setHours(17, 0, 0, 0));
  timecardFormGroup: FormGroup = new FormBuilder().group({
    worker: [null, [Validators.required]],
    projectSite: [null, [Validators.required]],
    date: [null, [Validators.required]],
    startTime: [this.startTime, [Validators.required]],
    endTime: [this.endTime, [Validators.required]],
    workedThroughLunch: [false],
    extraBreak: [false],
    breakDuration: [null],
    totalWorkHours: [0],
    overTimeHours: [0],
    normalHours: [0],
  });
  showPage: boolean = false;

  constructor(
    private sandbox: EtoanSandboxService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private etoanHttp: EtoanHttpService
  ) {}

  ngOnInit(): void {
    this.sandbox.getEmployeeDetails();
    this.sandbox.getProjectSites();
    this.initSubscriptions();
  }

  initSubscriptions() {
    combineLatest({
      workers: this.sandbox.employeeDetails$,
      projectSite: this.sandbox.projectSites$,
    })
      .pipe(
        filter(
          ({ workers, projectSite }) =>
            (workers || []).length > 0 && (projectSite || []).length > 0,
        ),
      )
      .subscribe(({ workers, projectSite }) => {
        workers?.forEach((worker) => {
          this.refEntityIdList.push({code: worker.identifierNumber || '', refEntityId: worker.entityId})
          this.workerList.push({
            name: worker.name,
            code: worker.identifierNumber || '',
          });
        });
        projectSite
          ?.filter((project) => project.status === 'ACTIVE')
          .forEach((site) => {
            this.projectList.push({
              name: site.projectSiteName,
              code: site.id || 0,
            });
          });

        this.showPage = true;
        this.calculateTotalHours();
      });
  }

  maskString(value: string): string {
    if (!value) return '';
    return 'X'.repeat(value.length - 4) + value.slice(-4);
  }

  getIdentifierNumber(): string {
    const selectedWorker = this.timecardFormGroup.get('worker')?.value.name;
    return this.maskString(
      this.workerList.find((worker) => worker.name === selectedWorker)?.code ||
        '',
    );
  }

  onSaveClicked(event: Event) {
    if (this.timecardFormGroup.invalid) {
      this.timecardFormGroup.markAllAsTouched();
      return;
    }
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Submitting timecard for ${this.timecardFormGroup.get('worker')?.value.name} (FIN: ${this.getIdentifierNumber()})`,
      header: 'Confirmation',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-verified',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Save',
      },
      accept: () => {
       this.saveTimeCard()
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Rejected',
          detail: 'You have rejected',
        });
      },
    });
  }
  resetForm() {
    this.timecardFormGroup.reset({startTime: this.startTime, endTime: this.endTime});
    this.calculateTotalHours()

  }

  calculateTotalHours() {
    const startTime = new Date(this.timecardFormGroup.get('startTime')?.value);
    const endTime = new Date(this.timecardFormGroup.get('endTime')?.value);
    const isLunchTimeWork =
      this.timecardFormGroup.get('workedThroughLunch')?.value;
    const lunchHour = 1;
    let normalHours = 0;
    let overTimeHours = 0;
    let totalWorkHours: number =
      endTime.getHours() - startTime.getHours() - lunchHour;

    if (isLunchTimeWork) {
      totalWorkHours = totalWorkHours + 1;
    }
    if (totalWorkHours > 8) {
      overTimeHours = totalWorkHours - 8;
      normalHours = 8;
    }
    if (totalWorkHours <= 8) {
      normalHours = totalWorkHours;
    }
    this.timecardFormGroup.get('totalWorkHours')?.patchValue(totalWorkHours);
    this.timecardFormGroup.get('normalHours')?.patchValue(normalHours);
    this.timecardFormGroup.get('overTimeHours')?.patchValue(overTimeHours);
  }

  saveTimeCard(){
    const formValues = this.timecardFormGroup.value
    const payload: TimecardEntry = {
      employeeName: formValues.worker.name,
      startTime: new Date(formValues.startTime).toISOString(),
      endTime: new Date(formValues.endTime).toISOString(),
      lunchTimeWork: formValues.workedThroughLunch,
      projectSite: formValues.projectSite.name,
      normalHours: formValues.normalHours,
      overTimeHours: formValues.overTimeHours,
      totalHours: formValues.totalWorkHours,
      identifierNumber: formValues.worker.code,
      date: formValues.date,
      refEntityId: this.refEntityIdList.find((entityId) => entityId.code === formValues.worker.code)?.refEntityId

    }
    this.etoanHttp.postSaveTimeCard(payload).subscribe(({status, error}) => {
      if(status === 201){
        this.resetForm()
        this.messageService.add({
           severity: 'success',
           summary: 'Successful',
           detail: 'You have submitted your timecard. Thank you',
         });
      }
      if(error){
        if(error.code === '23505'){
           this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: 'Timecard Already Exists. Please contact admin',
        });
        return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: 'Timecard Submission Unsuccessful.',
        });
      }
    })
  }
}
