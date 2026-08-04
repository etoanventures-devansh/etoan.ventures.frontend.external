import { Routes } from '@angular/router';
import { TimecardEntryComponent } from './pages/timecard-entry/timecard-entry.component';
import { LoginComponent } from './pages/login/login.component';
import { ViewTimecardComponent } from './pages/view-timecard/view-timecard.component';
import { SalaryEntryComponent } from './pages/salary-entry/salary-entry.component';
import { TimecardRecordsComponent } from './pages/timecard-records/timecard-records.component';
import { SalaryRecordsComponent } from './pages/salary-records/salary-records.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EtoanInvoiceComponent } from './components/etoan-invoice/etoan-invoice.component';

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
        path: 'dashboard',
        component: DashboardComponent
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
    },
    {
        path: 'salary-records',
        component: SalaryRecordsComponent
    },
    {
        path: 'invoice',
        component: EtoanInvoiceComponent
    }
];
