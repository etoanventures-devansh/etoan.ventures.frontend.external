import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from "primeng/inputnumber";
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-salary-entry',
  imports: [ButtonModule, InputTextModule, SelectModule, DatePickerModule, CardModule, DialogModule, CheckboxModule, TagModule, TableModule, InputNumberModule, DecimalPipe],
  templateUrl: './salary-entry.component.html',
  styleUrl: './salary-entry.component.scss'
})
export class SalaryEntryComponent {

   employees = [
    {
      name: 'Alexander Chen',
      designation: 'Senior Software Engineer',
      nric: 'SXXXX789C',
    },
  ];

  selectedEmployee = this.employees[0];

  months = ['Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024'];
  selectedMonth = 'Mar 2024';

  paymentModes = [
    'Bank Transfer (GIRO)',
    'Cash',
    'Cheque',
  ];

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
    return (
      this.grossSalary -
      this.totalDeductions +
      this.roundingAdjustment
    );
  }

}
