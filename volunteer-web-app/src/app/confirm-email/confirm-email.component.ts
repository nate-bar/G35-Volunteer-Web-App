import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistrationService } from '../pages/registration/registration.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.scss']
})
export class ConfirmEmailComponent implements OnInit {
  confirmationMessage: string = '';
  errorMessage: string = '';
  redirectionMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private registrationService: RegistrationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get token from the route
    const token = this.route.snapshot.paramMap.get('token');

    if (token) {
      // Call the registration service to confirm the email
      this.registrationService.confirmEmail(token).subscribe(
        (response: any) => {
          console.log('Email confirmed:', response);
          this.confirmationMessage = response.message;
          this.errorMessage = '';

          // Wait for a moment to display the confirmation message
          setTimeout(() => {
            // Hide the confirmation message
            this.confirmationMessage = '';

            // Show the redirection message
            this.redirectionMessage = 'Redirecting to your profile page...';

            // Redirect to the profile page after another delay
            setTimeout(() => {
              this.router.navigate(['/profile']);
            }, 3000);
          }, 2000); // Delay before showing the redirection message
        },
        (error) => {
          // Handle error response from backend
          this.errorMessage = error.error?.message || 'Invalid or expired token. Please try again.';
          this.confirmationMessage = '';
          this.redirectionMessage = '';
          console.error('Error confirming email:', error);
        }
      );
    } else {
      this.errorMessage = 'Invalid or missing token.';
    }
  }
}
