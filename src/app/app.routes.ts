import { Routes } from '@angular/router';
import { TimecardEntryComponent } from './pages/timecard-entry/timecard-entry.component';
import { LoginComponent } from './pages/login/login.component';
import { ViewTimecardComponent } from './pages/view-timecard/view-timecard.component';
import { SalaryEntryComponent } from './pages/salary-entry/salary-entry.component';
import { TimecardRecordsComponent } from './pages/timecard-records/timecard-records.component';

export const routes: Routes = [
    {
        path: 'timecard-submission',
        component: TimecardEntryComponent
    },
    {
        path: '',
        component: LoginComponent
    },
    {
        path: 'view-timecard',
        component: ViewTimecardComponent
    },
    {
        path: 'salary-entry',
        component: SalaryEntryComponent
    },
    {
        path: 'timecard-records',
        component: TimecardRecordsComponent
    }
];
