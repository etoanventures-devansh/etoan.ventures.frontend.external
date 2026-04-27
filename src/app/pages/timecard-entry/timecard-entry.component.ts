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
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-timecard-entry',
  imports: [ButtonModule, InputTextModule, SelectModule, DatePickerModule, CardModule, DialogModule, CheckboxModule, TagModule, TableModule, CalendarModule],
  templateUrl: './timecard-entry.component.html',
  styleUrl: './timecard-entry.component.scss'
})
export class TimecardEntryComponent {

}
