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

  constructor(private fb: FormBuilder, private router: Router, private registrationService: RegistrationService) {
    this.profileForm = this.fb.group({
      email: this.email,
      password: this.password,
      role: this.role,
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.registrationService.register(this.profileForm.value).subscribe(
        (response: any) => {
          console.log('Registration initiated:', response);
          this.successMessage = 'Registration initiated. Please check your email to confirm.';
          this.errorMessage = '';

          // Optionally reset the form here
          this.profileForm.reset();
        },
        (error) => {
          // Handle error response from backend
          this.successMessage = '';
          this.errorMessage = error.error?.error || 'An unexpected error occurred. Please try again.';
          console.error('Error registering:', error);
        }
      );
    } else {
      this.profileForm.markAllAsTouched();
      this.errorMessage = 'Please fill out the form correctly.';
    }
  }

  isFieldInvalid(control: FormControl): boolean {
    return control.invalid && control.touched;
  }
}
