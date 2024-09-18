import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  profileForm: FormGroup;
  states = ['CA', 'NY', 'TX', 'FL', 'PA']; // state codes
  skills = ['Communication', 'Leadership', 'Teamwork', 'Problem-solving'];
  selectedDates: Date[] = [];
  skillOptions = [
    { value: 'Communication', label: 'Communication' },
    { value: 'Leadership', label: 'Leadership' },
    { value: 'Teamwork', label: 'Teamwork' },
    { value: 'Problem-Solving', label: 'Problem-Solving' },
    { value: 'Time Management', label: 'Time Management' },
    { value: 'Critical Thinking', label: 'Critical Thinking' },
    { value: 'Adaptability', label: 'Adaptability' }
  ];
  availableDates: string[] = [
    '2024-09-20',
    '2024-09-22',
    '2024-09-25',
    '2024-09-27'
  ];

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      availability: ['', [Validators.required, this.availableDateValidator.bind(this)]],
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
  
  onDateSelection(event: any): void {
    this.selectedDates.push(event.value);
    this.profileForm.patchValue({ availability: this.selectedDates });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      console.log(this.profileForm.value);

    } else {
      alert('Please complete the form correctly.');
    }
  }

  
     // Custom validator to check if the selected date is in the list of available dates
  availableDateValidator(control: AbstractControl): ValidationErrors | null {
    const selectedDate = control.value;
    const isValid = this.availableDates.includes(selectedDate);
    console.log(selectedDate);
    return isValid ? null : { unavailableDate: true };
  }
}

