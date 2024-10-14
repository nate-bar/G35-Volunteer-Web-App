import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  userEmail: string = '';
  isLoggedIn: boolean = false;
  isRegisterPage: boolean = false;

  constructor(public authService: AuthService, private router: Router,private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Check if user is logged in
    this.isLoggedIn = this.authService.getIsLoggedIn();

    if (this.isLoggedIn) {
      // Subscribe to userProfile$ to get the user email
      this.authService.userProfile$.subscribe((profile) => {
        if (profile) {
          this.userEmail = profile.email;
          console.log('User email in HeaderComponent:', this.userEmail);
        } else {
          // If profile is not available, fetch it using the stored email
          const storedEmail = this.authService.getUserEmail();
          if (storedEmail) {
            this.authService.fetchUserProfile(storedEmail).subscribe((userProfile) => {
              if (userProfile) {
                this.userEmail = userProfile.email;
              }
            });
          }
        }
      });
    }

    // Determine if the current page is the registration page
    this.isRegisterPage = this.router.url.includes('/register');
    this.cdRef.detectChanges();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToProfile() {
    console.log('Navigate to Profile');
    if (this.userEmail) {
      this.router.navigate(['/profile'], { queryParams: { email: this.userEmail } });
    }
  }
}
