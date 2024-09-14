import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminComponent } from "./user/admin/admin.component";
import { LoginComponent } from "./pages/login/login.component";
import { RegistrationComponent } from "./pages/registration/registration.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AdminComponent, LoginComponent, RegistrationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'volunteer-web-app';
}
