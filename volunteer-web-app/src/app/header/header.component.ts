import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { ChangeDetectorRef,ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule,MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  userEmail: string = '';
  isLoggedIn: boolean = false;
  isRegisterPage: boolean = false;
  userFullName: string = '';
  showDropdown: boolean = false;
  

  constructor(public authService: AuthService, private router: Router,private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Check if user is logged in
    this.isLoggedIn = this.authService.getIsLoggedIn();

    if (this.isLoggedIn) {
      // Subscribe to userProfile$ to get the user email
      this.authService.userProfile$.subscribe((profile) => {
        if (profile) {
          this.userEmail = profile.email;
          this.userFullName = profile.full_name;
          this.cdRef.markForCheck();
          // console.log('User email in HeaderComponent:', this.userEmail);
          console.log('User full name in HeaderComponent:', this.userFullName);
        } else {
          // If profile is not available, fetch it using the stored email
          const storedEmail = this.authService.getUserEmail();
          if (storedEmail) {
            this.authService.fetchUserProfile(storedEmail).subscribe((userProfile) => {
              if (userProfile) {
                this.userEmail = userProfile.email;
                this.userFullName = userProfile.full_name;
                this.cdRef.markForCheck();
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

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }
}
