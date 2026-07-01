import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { CommonModule, DecimalPipe } from '@angular/common';
import { EtoanSandboxService } from '../../store/sandbox/etoan-sandbox';
import { combineLatest, forkJoin, startWith } from 'rxjs';
import {
  EmployeeDetails,
  EmployeeSalaryRate,
  EmployeeSalaryRecords,
} from '../../models/etoan-models';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EtoanHttpService } from '../../services/etoan-http-service.service';

@Component({
  selector: 'app-salary-entry',
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
    InputNumberModule,
    DecimalPipe,
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './salary-entry.component.html',
  styleUrl: './salary-entry.component.scss',
})
export class SalaryEntryComponent implements OnInit, AfterViewInit {
  workerDetails: { name: string; id: string }[] = [];
  employeeDetails: EmployeeDetails[] | null = [];
  salaryRate: EmployeeSalaryRate[] | null = [];
  paymentModes = ['BANK TRANSFER', 'CASH', 'CHEQUE'];
  months: string[] = [];
  selectedMonth = '';
  showPage: boolean = false;

  payrollForm: FormGroup | undefined;

  constructor(
    private sandbox: EtoanSandboxService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private etoanHttp: EtoanHttpService,
  ) {
    this.payrollForm = new FormBuilder().group({
      workerName: [null, Validators.required],
      designation: ['', Validators.required],
      identifierNumber: ['', Validators.required],
      dateOfPayment: [new Date(), Validators.required],
      modeOfPayment: ['', Validators.required],
      payslipPeriod: ['', Validators.required],

      paymentDate: [new Date(), Validators.required],

      basicPay: [0.0, [Validators.required, Validators.min(0)]],
      daysWorked: [0.0, [Validators.required, Validators.min(0)]],
      totalBasicPay: [0.0],

      otRate: [0.0, [Validators.min(0)]],
      otHours: [0.0, [Validators.min(0)]],
      totalOtPay: [0.0],

      medical: [0.0, [Validators.min(0)]],
      totalTransport: [0.0, [Validators.min(0)]],
      transportDays: [0.0, Validators.required],
      transportRate: [0.0],
      otherPayments: [0.0, [Validators.min(0)]],

      cashAdvance: [0.0, [Validators.min(0)]],
      fines: [0.0, [Validators.min(0)]],
      totalDeductions: [0.0],

      grossSalary: [0.0],
      roundingAdjustment: [0.0],
      finalNetSalary: [0.0],
    });
  }

  ngOnInit(): void {
    this.generateMonths();
    this.sandbox.getEmployeeSalaryRates();
    this.sandbox.getEmployeeDetails();
    this.initSubscriptions();
  }

  ngAfterViewInit(): void {
    this.payrollForm
      .get('workerName')
      ?.valueChanges.subscribe(({ name, id }) => {
        const selectedWorkerDetails = this.employeeDetails?.find(
          (worker) => worker.name === name,
        );
        const selectedWorkerSalaryRate = this.salaryRate.find(
          (rates) =>
            selectedWorkerDetails.entityId === rates.employee_entity_id,
        );
        this.payrollForm.patchValue({
          designation: selectedWorkerDetails?.designation,
          identifierNumber: selectedWorkerDetails?.identifierNumber,
          dateOfPayment: new Date(),
          basicPay: selectedWorkerSalaryRate.daily_rate,
          otRate: selectedWorkerSalaryRate.overtime_rate,
          transportRate: selectedWorkerSalaryRate.transport_rate,
        });
      });

    // Basic Pay + OT Pay Calculation

    combineLatest({
      daysWorked: this.payrollForm
        .get('daysWorked')!
        .valueChanges.pipe(
          startWith(this.payrollForm.get('daysWorked')!.value),
        ),
      otHours: this.payrollForm
        .get('otHours')!
        .valueChanges.pipe(startWith(this.payrollForm.get('otHours')!.value)),
    }).subscribe(({ daysWorked, otHours }) => {
      this.payrollForm.patchValue({
        totalBasicPay: +daysWorked * +this.payrollForm.get('basicPay')!.value,
        totalOtPay: +otHours * +this.payrollForm.get('otRate')!.value,
      });
    });

    // Total Transport Calculation

    combineLatest({
      transportRate: this.payrollForm
        .get('transportRate')!
        .valueChanges.pipe(
          startWith(this.payrollForm.get('transportRate')!.value),
        ),
      transportDays: this.payrollForm
        .get('transportDays')!
        .valueChanges.pipe(
          startWith(this.payrollForm.get('transportDays')!.value),
        ),
    }).subscribe(({ transportRate, transportDays }) => {
      this.payrollForm.patchValue({
        totalTransport: +transportDays * +transportRate,
      });
    });

    // Gross Salary Calculation

    combineLatest({
      totalBasicPay: this.payrollForm
        .get('totalBasicPay')
        .valueChanges.pipe(
          startWith(this.payrollForm.get('totalBasicPay')!.value),
        ),
      totalOtPay: this.payrollForm
        .get('totalOtPay')
        .valueChanges.pipe(
          startWith(this.payrollForm.get('totalOtPay')!.value),
        ),
      totalTransport: this.payrollForm
        .get('totalTransport')
        .valueChanges.pipe(
          startWith(this.payrollForm.get('totalTransport')!.value),
        ),
      medical: this.payrollForm
        .get('medical')
        .valueChanges.pipe(startWith(this.payrollForm.get('medical')!.value)),
      otherPayments: this.payrollForm
        .get('otherPayments')
        .valueChanges.pipe(
          startWith(this.payrollForm.get('otherPayments')!.value),
        ),
    }).subscribe(
      ({
        totalBasicPay,
        totalOtPay,
        totalTransport,
        medical,
        otherPayments,
      }) => {
        this.payrollForm.patchValue({
          grossSalary:
            +totalBasicPay +
            +totalOtPay +
            +totalTransport +
            +medical +
            +otherPayments,
        });
      },
    );

    // Deductions Calculation

    combineLatest({
      cashAdvance: this.payrollForm
        .get('cashAdvance')
        .valueChanges.pipe(
          startWith(this.payrollForm.get('cashAdvance')!.value),
        ),
      fines: this.payrollForm
        .get('fines')
        .valueChanges.pipe(startWith(this.payrollForm.get('fines')!.value)),
    }).subscribe(({ cashAdvance, fines }) => {
      this.payrollForm.patchValue({
        totalDeductions: +cashAdvance + +fines,
      });
    });

    // Net Salary Calculation
    combineLatest({
      grossSalary: this.payrollForm
        .get('grossSalary')
        .valueChanges.pipe(
          startWith(this.payrollForm.get('grossSalary')!.value),
        ),
      totalDeductions: this.payrollForm
        .get('totalDeductions')
        .valueChanges.pipe(
          startWith(this.payrollForm.get('totalDeductions')!.value),
        ),
      roundingAdjustment: this.payrollForm
        .get('roundingAdjustment')
        .valueChanges.pipe(
          startWith(this.payrollForm.get('roundingAdjustment')!.value),
        ),
    }).subscribe(({ grossSalary, totalDeductions, roundingAdjustment }) => {
      this.payrollForm.patchValue({
        finalNetSalary: +grossSalary + +roundingAdjustment - +totalDeductions,
      });
    });
  }

  initSubscriptions() {
    combineLatest({
      workers: this.sandbox.employeeDetails$,
      salaryRate: this.sandbox.employeeSalaryRate$,
    }).subscribe(({ workers, salaryRate }) => {
      this.employeeDetails = workers;
      this.workerDetails =
        workers?.map((worker) => ({
          name: worker.name,
          id: worker.entityId ?? '',
        })) ?? [];
      this.salaryRate = salaryRate;
      this.showPage = true;
    });
  }

  generateMonths() {
    const formatter = new Intl.DateTimeFormat('en', {
      month: 'short',
      year: 'numeric',
    });

    const today = new Date();

    // Generate from -3 to +3 months
    this.months = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 3 + i, 1);
      return formatter.format(date);
    });

    // Default to previous month
    const previousMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    this.selectedMonth = formatter.format(previousMonth);
    this.payrollForm.patchValue({
      payslipPeriod: this.selectedMonth,
    });
  }

  resetForm() {
    this.payrollForm.reset();
  }

  onSaveClicked(event: Event) {
    if (this.payrollForm.invalid) {
      this.payrollForm.markAllAsTouched();
      return;
    }
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Submitting Salary for ${this.payrollForm.get('workerName')?.value.name} (FIN: ${this.payrollForm.get('identifierNumber').value}) for month of ${this.payrollForm.get('payslipPeriod').value}`,
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
        this.saveSalaryEntry();
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancel',
          detail: 'You have cancelled salary submission.',
        });
      },
    });
  }

  saveSalaryEntry() {
    const formValue = this.payrollForm.value;

    const salaryRecord: EmployeeSalaryRecords = {
      employee_entity_id: formValue.workerName.id,
      employee_name: formValue.workerName.name,
      identifier_number: formValue.identifierNumber,
      designation: formValue.designation,

      salary_year: new Date(formValue.paymentDate).getFullYear(),
      salary_month: new Date(formValue.paymentDate).getMonth() + 1,

      payslip_period_start: this.getPayslipPeriodStart(formValue.payslipPeriod),
      payslip_period_end: this.getPayslipPeriodEnd(formValue.payslipPeriod),

      payment_date: formValue.paymentDate,
      payment_mode: formValue.modeOfPayment,

      basic_pay_rate: formValue.basicPay,
      days_worked: formValue.daysWorked,
      total_basic_pay: formValue.totalBasicPay,

      overtime_hours: formValue.otHours,
      overtime_rate: formValue.otRate,
      total_overtime_pay: formValue.totalOtPay,

      medical_allowance: formValue.medical,
      transport_allowance: formValue.totalTransport,
      other_payments: formValue.otherPayments,

      gross_salary: formValue.grossSalary,

      deduction_cash_advance: formValue.cashAdvance,
      fines: formValue.fines,
      total_deduction: formValue.totalDeductions,

      rounding_adjustment: formValue.roundingAdjustment,
      net_salary: formValue.finalNetSalary,
    };

    this.etoanHttp
      .postSaveSalaryEntry(salaryRecord)
      .pipe()
      .subscribe(({ status, error }) => {
        if (status === 201) {
          this.resetForm();
          this.messageService.add({
            severity: 'success',
            summary: 'Successful',
            detail: 'You have submitted salary entry. Thank you',
          });
        }
        if (error) {
          if (error.code === '23505') {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: 'Salary Entry already exists. Please contact admin',
            });
            return;
          }
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: 'Salary Entry Unsuccessful.',
          });
        }
      });
  }

  private getPayslipPeriodStart(period: string): string {
    const date = new Date(`1 ${period}`);
    return new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .split('T')[0];
  }

  private getPayslipPeriodEnd(period: string): string {
    const date = new Date(`1 ${period}`);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
  }
}
