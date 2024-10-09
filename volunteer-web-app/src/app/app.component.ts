import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service'; // Import AuthService
import { CommonModule } from '@angular/common';
import { FooterComponent } from "./footer/footer.component";
import { HeaderComponent } from './header/header.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, RouterModule, CommonModule, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'volunteer-web-app';
  isAdminPage = false;
  isLoggedIn$: Observable<boolean>;  // Observable for login state

  constructor(public router: Router, private authService: AuthService) {
    // Subscribe to the login state observable
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    // Check if the current URL contains 'admin'
    this.router.events.subscribe(() => {
      this.isAdminPage = this.router.url.includes('/admin');
    });
  }
}
