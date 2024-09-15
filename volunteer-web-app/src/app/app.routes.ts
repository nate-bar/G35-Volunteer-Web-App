import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { AdminComponent } from './user/admin/admin.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { EventsComponent } from './pages/events/events.component';
import { ProfileComponent } from './user/profile/profile.component';

export const routes: Routes = [
    {
        path: '', // Default route (home)
        component: WelcomeComponent, 
        pathMatch: 'full'
    },
    {
        path: 'register', 
        component: RegistrationComponent 
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'admin',
        component: AdminComponent
    },
    
    {
        path: 'events',
        component: EventsComponent
    },
    {
        path: 'profile',
        component: ProfileComponent
    },
    {
        path: '**',
        redirectTo: '' 
    },
];
