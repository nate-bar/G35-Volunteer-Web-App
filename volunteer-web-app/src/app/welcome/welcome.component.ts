import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../auth.service'; 

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: true,
  imports: [FormsModule, RouterModule] // Import FormsModule here
})
export class WelcomeComponent implements OnInit {

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID to detect environment
  ) {}

  ngOnInit(): void {
    // Log out the user automatically if they access the welcome page and are logged in
    if (isPlatformBrowser(this.platformId) && this.authService.getIsLoggedIn()) {
      this.authService.logout();
    }

    // Detect when the user tries to navigate away from the welcome page
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (isPlatformBrowser(this.platformId)) {
          const currentUrl = event.urlAfterRedirects;
          if (currentUrl !== '/' && !this.authService.getIsLoggedIn()) {
            // Redirect to login if user tries to navigate to another page and is not logged in
            this.router.navigate(['/login']);
          }
        }
      });
  }
}

