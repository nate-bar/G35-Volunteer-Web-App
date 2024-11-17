import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { AdminComponent } from './user/admin/admin.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { EventsComponent } from './pages/events/events.component';
import { ProfileComponent } from './user/profile/profile.component';
import { NewEventComponent } from './pages/new-event/new-event.component';
import { EditEventComponent } from './pages/edit-event/edit-event.component';
import { UsersEventsComponent } from './view/users-events/users-events.component';
import { VolunteerMatchingComponent } from './pages/volunteer-matching/volunteer-matching.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { VolunteerHistoryComponent } from './pages/volunteer-history/volunteer-history.component';
import { ConfirmEmailComponent } from './confirm-email/confirm-email.component';
import { authGuard } from './auth.guard';

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
        component: AdminComponent,
        canActivate: [authGuard],
        children: [
           
            {
                path: 'home', 
                component: AdminComponent 
            },
            {
                path: 'volunteerHistory', 
                component: VolunteerHistoryComponent 
            },
            {
                path: 'manageUser', 
                component: UserManagementComponent 
            },
            {
              path: 'newEvent',
              component: NewEventComponent,
            },
            {
                path: 'events',
                component: EventsComponent,
            },
            {
                path: 'editEvent',
                component: EditEventComponent,
            },
            {
                path: 'matchVolunteers',
                component: VolunteerMatchingComponent, 
            }
            // other childrens
          ],
    },
    { path: 'confirm-email/:token', component: ConfirmEmailComponent },
    //{
    //     path: 'newEvent',
    //     component: NewEventComponent
    // },
    // {
    //     path: 'events',
    //     component: EventsComponent  VolunteerMatchingComponent
    // },
    {
        path: 'profile',
        component: ProfileComponent
    },
    {
        path: 'userEvent',
        component: UsersEventsComponent,
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: '' 
    },
];