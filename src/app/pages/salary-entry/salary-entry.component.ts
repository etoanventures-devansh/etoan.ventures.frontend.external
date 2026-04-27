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

@Component({
  selector: 'app-salary-entry',
  imports: [ButtonModule, InputTextModule, SelectModule, DatePickerModule, CardModule, DialogModule, CheckboxModule, TagModule, TableModule],
  templateUrl: './salary-entry.component.html',
  styleUrl: './salary-entry.component.scss'
})
export class SalaryEntryComponent {

}
