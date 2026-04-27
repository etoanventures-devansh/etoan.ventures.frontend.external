import { Routes } from '@angular/router';
import { TimecardEntryComponent } from './pages/timecard-entry/timecard-entry.component';
import { LoginComponent } from './pages/login/login.component';
import { ViewTimecardComponent } from './pages/view-timecard/view-timecard.component';

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
    }
];
