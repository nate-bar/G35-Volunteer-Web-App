import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from './profile.service'; 
import { AuthService } from '../../auth.service';
import { MatIconModule } from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';



@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatChipsModule 
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  warmingMessage: string = '';
  states: any[] = [];
  minDate: Date | undefined;
  // states = ['CA', 'NY', 'TX', 'FL', 'PA']; // state codes
  skillOptions = [
    { value: 'Communication', label: 'Communication' },
    { value: 'Leadership', label: 'Leadership' },
    { value: 'Teamwork', label: 'Teamwork' },
    { value: 'Problem-Solving', label: 'Problem-Solving' },
    { value: 'Time Management', label: 'Time Management' },
    { value: 'Critical Thinking', label: 'Critical Thinking' },
    { value: 'Adaptability', label: 'Adaptability' }
  ];
  // availableDates: string[] = [
  //   '2024-09-20',
  //   '2024-09-22',
  //   '2024-09-25',
  //   '2024-09-27'
  // ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private profileService: ProfileService,private router: Router,private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }], // Email field as disabled
      availability: [[], Validators.required],
      fullName: ['', [Validators.required, Validators.maxLength(50)]],
      address1: ['', [Validators.required, Validators.maxLength(100)]],
      address2: ['', [Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(9)]],
      skills: [[], Validators.required],
      preferences: [''],
    });
  }

  ngOnInit(): void {
    let today=new Date();
    this.minDate = today;
    let email = this.route.snapshot.queryParamMap.get('email') || this.authService.getUserEmail();
    
    this.profileService.getStateCodes().subscribe(
      (response) => {
        this.states = response; 
      },
      (error) => {
        console.error('Error fetching states:', error);
      }
    );

    if (email) {
      this.authService.fetchUserProfile(email).subscribe(
        (response) => {
          // console.log('Profile fetched:', response);
          if (response && response.email) {
            this.profileForm.patchValue({
              email: response.email,
              fullName: response.full_name,
              address1: response.address1,
              address2: response.address2,
              city: response.city ? response.city.toLowerCase() : '',
              state: response.state,
              zipCode: response.zip_code,
              skills: response.skills,
              preferences: response.preferences,
              availability: response.availability,
            });
            this.profileForm.controls['email'].disable(); // Disable the email field after setting its value
            this.authService.updateUserProfile(response);
          }
        },
        (error) => {
          console.error('Error fetching profile:', error);
          this.errorMessage = 'Error fetching profile. Please try again.';
        }
      );
    }
  }
  


  onSubmit(): void {
    if (this.profileForm.valid) {
      const profileData = {
        ...this.profileForm.getRawValue(),
        email: this.profileForm.controls['email'].value, 
        availability: this.profileForm.controls['availability'].value 
      };
  
      this.profileService.completeUserProfile(profileData).subscribe(
        (response) => {
          console.log('Profile completed successfully:', response);
          localStorage.setItem('fullName', profileData.fullName);  // Store fullName directly
          
          // Optionally, update userProfile in local storage as well
          const updatedProfile = {
            ...profileData,
            full_name: profileData.fullName,
          };
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  
          this.successMessage = response.message || 'completed successfully!';
          this.errorMessage = '';
          this.warmingMessage = '';
  
          const userRole = this.authService.getUserRole();
          setTimeout(() => {
            if (userRole === 'admin') {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/userEvent']);
            }
          }, 2000);
        },
        (error) => {
          console.error('Error completing profile:', error);
          this.errorMessage = error.error?.error || 'An error occurred while completing the profile. Please try again.';
          this.successMessage = '';
          this.warmingMessage = '';
        }
      );
    } else {
      this.errorMessage = 'Please complete the form correctly.';
      this.successMessage = '';
      this.warmingMessage = '';
    }
  }
  

  // Method to format date to mm-dd-yyyy
formatDateToMMDDYYYY(date: Date): string {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formattedDate; // mm-dd-yyyy
}

addDate(date: Date): void {
  if (date) {
    const formattedDate = this.formatDateToMMDDYYYY(date); // Format the date to mm-dd-yyyy

    // Get the current value of availability (ensure it's an array)
    const currentDates = this.profileForm.controls['availability'].value || [];

    // Add the new date if it doesn't exist in the array
    if (!currentDates.includes(formattedDate)) {
      const updatedDates = [...currentDates, formattedDate];
      this.profileForm.controls['availability'].setValue(updatedDates);
    }
  }
}

removeDate(date: string): void {
  // Remove the selected date from the list
  const updatedDates = this.profileForm.controls['availability'].value.filter((d: string) => d !== date);
  this.profileForm.controls['availability'].setValue(updatedDates);
}
  
  
  // availableDateValidator(control: AbstractControl): ValidationErrors | null {
  //   const selectedDate = control.value;
  //   const isValid = this.availableDates.includes(selectedDate);
  //   return isValid ? null : { unavailableDate: true };
  // }
}
