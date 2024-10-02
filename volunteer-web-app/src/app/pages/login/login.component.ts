import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { LoginService } from './login.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private loginService: LoginService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID to detect environment
  ) {}

  ngOnInit(): void {
    // Retrieve the stored username if "Remember Me" was checked, only in the browser
    if (isPlatformBrowser(this.platformId)) {
      if (localStorage.getItem('rememberMe') === 'true') {
        this.username = localStorage.getItem('username') || '';
        this.rememberMe = true;
      }
    }
  }

  login(): void {
    this.loginService.login(this.username, this.password).subscribe(
      (response: any) => {
        console.log('Login successful:', response);
  
        // Log in the user using AuthService regardless of profile status
        this.authService.login(response.role, response.email);
  
        // Handle "Remember Me" option
        if (isPlatformBrowser(this.platformId)) {
          this.handleRememberMe();
        }
  
        if (!response.profile_completed) {
          // Display success message and add delay before redirecting to complete profile
          this.errorMessage='';
          this.successMessage = 'Login successful, Please complete your profile...';
          setTimeout(() => {
            this.router.navigate(['/profile'], { queryParams: { email: this.username } });
          }, 2000); // 2000ms (2 seconds) delay before redirecting
        } else {
          // Navigate to the appropriate page based on user role
          if (response.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/userEvent']);
          }
        }
      },
      (error) => {
        console.error('Error logging in:', error);
  
        // Handle error response from backend
        if (error.status === 0) {
          this.errorMessage = 'Email and password must not be empty.';
          this.successMessage ='';
        } else if (error.error && error.error.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again.';
        }
      }
    );
  }
  

  cancel(): void {
    // Clear form fields
    this.username = '';
    this.password = '';
    this.rememberMe = false;
    this.errorMessage = '';
  }

  handleRememberMe(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.rememberMe) {
        // Store username
        localStorage.setItem('username', this.username);
        localStorage.setItem('rememberMe', 'true');
      } else {
        // Clear stored username
        localStorage.removeItem('username');
        localStorage.setItem('rememberMe', 'false');
      }
    }
  }
}
