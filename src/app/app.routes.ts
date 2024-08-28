import { Routes } from '@angular/router';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
    { path: 'dashboard', component: DashboardComponent},
    { path: 'schedule', component: ScheduleComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full'}
];
