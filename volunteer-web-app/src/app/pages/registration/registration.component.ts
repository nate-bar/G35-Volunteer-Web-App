import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationService } from './registration.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HeaderComponent } from '../../header/header.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule, 
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent {
  profileForm: FormGroup;
  email = new FormControl('', [
    Validators.required,
    Validators.email,
    Validators.maxLength(100),
  ]);

  password = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
  ]);

  role = new FormControl('', [
    Validators.required,
  ]);

  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;
  progress: number = 0; // Track the loading progress in percentage
  private progressInterval: any;

  constructor(private fb: FormBuilder, private router: Router, private registrationService: RegistrationService) {
    this.profileForm = this.fb.group({
      email: this.email,
      password: this.password,
      role: this.role,
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      this.progress = 0; // Reset progress
      this.startProgress(); // Start incrementing progress
      this.registrationService.register(this.profileForm.value).subscribe(
        (response: any) => {
          console.log('Registration initiated:', response);
          this.successMessage = 'Registration initiated. Please check your email to confirm.';
          this.errorMessage = '';
          this.loading = false;
          this.stopProgress(); // Stop incrementing progress

          // Optionally reset the form here
          this.profileForm.reset();
        },
        (error) => {
          // Handle error response from backend
          this.successMessage = '';
          this.errorMessage = error.error?.error || 'An unexpected error occurred. Please try again.';
          console.error('Error registering:', error);
          this.loading = false;
          this.stopProgress(); // Stop incrementing progress
        }
      );
    } else {
      this.profileForm.markAllAsTouched();
      this.errorMessage = 'Please fill out the form correctly.';
    }
  }

  onCancel(): void {
    // Reset the form fields and clear any error or success messages
    this.profileForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  isFieldInvalid(control: FormControl): boolean {
    return control.invalid && control.touched;
  }

  startProgress(): void {
    this.progressInterval = setInterval(() => {
      if (this.progress < 100) {
        this.progress += 1; // Increment progress
      } else {
        this.stopProgress(); // Stop once it reaches 100%
      }
    }, 50); // Adjust the interval time to control speed
  }

  stopProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval); // Clear the interval
      this.progressInterval = null;
    }
  }
}
