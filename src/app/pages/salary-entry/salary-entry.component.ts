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
import { combineLatest } from 'rxjs';
import { EmployeeDetails, EmployeeSalaryRate } from '../../models/etoan-models';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

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
  ],
  templateUrl: './salary-entry.component.html',
  styleUrl: './salary-entry.component.scss',
})
export class SalaryEntryComponent implements OnInit, AfterViewInit {
  workerDetails: { name: string; id: string }[] = [];
  employeeDetails: EmployeeDetails[] | null = [];
  salaryRate: EmployeeSalaryRate[] | null = [];
  paymentModes = ['Bank Transfer (GIRO)', 'Cash', 'Cheque'];
  months: string[] = [];
  selectedMonth = '';
  showPage: boolean = false;

  payrollForm: FormGroup | undefined;

  constructor(private sandbox: EtoanSandboxService) {
    this.payrollForm = new FormBuilder().group({
      workerName: [null, Validators.required],
      designation: ['', Validators.required],
      identifierNumber: ['', Validators.required],
      dateOfPayment: [new Date(), Validators.required],
      modeOfPayment: ['', Validators.required],
      selectedMonth: ['', Validators.required],
      payslipPeriod: ['', Validators.required],

      paymentMode: ['Bank Transfer (GIRO)', Validators.required],
      paymentDate: [new Date(), Validators.required],

      basicPay: [0.0, [Validators.required, Validators.min(0)]],
      daysWorked: [0.0, [Validators.required, Validators.min(0)]],

      otRate: [0.0, [Validators.min(0)]],
      otHours: [0.0, [Validators.min(0)]],

      medical: [0.0, [Validators.min(0)]],
      transport: [0.0, [Validators.min(0)]],
      otherPayments: [0.0, [Validators.min(0)]],

      cashAdvance: [0.0, [Validators.min(0)]],
      fines: [0.0, [Validators.min(0)]],

      roundingAdjustment: [0.0],
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
        console.warn(name);
        const selectedWorkerDetails = this.employeeDetails?.find(
          (worker) => worker.name === name,
        );
        const selectedWorkerSalaryRate = this.salaryRate.find((rates) => selectedWorkerDetails.entityId === rates.employee_entity_id)
        this.payrollForm.patchValue({
          designation: selectedWorkerDetails?.designation,
          identifierNumber: selectedWorkerDetails?.identifierNumber,
          dateOfPayment: new Date(),
          basicPay: selectedWorkerSalaryRate.daily_rate,
          otRate: selectedWorkerSalaryRate.overtime_rate
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
          id: worker.identifierNumber ?? '',
        })) ?? [];
      this.salaryRate = salaryRate;
      console.warn(salaryRate);
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
  }

  paymentMode = 'Bank Transfer (GIRO)';
  paymentDate = new Date();

  basicPay = 5500;
  daysWorked = 22;

  otRate = 45;
  otHours = 10;

  medical = 150;
  transport = 200;
  otherPayments = 0;

  cashAdvance = 0;
  fines = 0;

  roundingAdjustment = 0.25;

  get totalOtPay(): number {
    return this.otRate * this.otHours;
  }

  get totalAllowances(): number {
    return this.medical + this.transport + this.otherPayments;
  }

  get totalDeductions(): number {
    return this.cashAdvance + this.fines;
  }

  get grossSalary(): number {
    return this.basicPay + this.totalOtPay + this.totalAllowances;
  }

  get finalSalary(): number {
    return this.grossSalary - this.totalDeductions + this.roundingAdjustment;
  }
}
