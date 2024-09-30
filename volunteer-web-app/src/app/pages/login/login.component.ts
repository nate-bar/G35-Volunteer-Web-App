import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { LoginService } from './login.service';
import { CommonModule,isPlatformBrowser } from '@angular/common';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private loginService: LoginService, // Use LoginService
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID to detect environment
  ) {}

  ngOnInit(): void {
    // Retrieve the stored username if "Remember Me" was checked
    if (localStorage.getItem('rememberMe') === 'true') {
      this.username = localStorage.getItem('username') || '';
      this.rememberMe = true;
    }
  }

  login(): void {
    // Use LoginService to make a request to the Flask API
    this.loginService.login(this.username, this.password).subscribe(
      (response: any) => {
        console.log('Login successful:', response);

        // Log in the user using AuthService
        this.authService.login(response.role);

        // Handle "Remember Me" option
        this.handleRememberMe();

        // Navigate to the appropriate page based on user role
        if (response.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/userEvent']);
        }
      },
      (error) => {
        // Log the complete error object
        console.error('Error logging in:', error);
  
        // Handle error response from backend
        if (error.status === 0) {
          this.errorMessage = 'Email and password must not be empty';
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
