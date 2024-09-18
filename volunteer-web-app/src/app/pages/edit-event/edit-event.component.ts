import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { CommonModule } from '@angular/common'; 


@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatInputModule
  ],
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.scss'
})
export class EditEventComponent {
  eventForm: FormGroup;
  skills = ['Communication', 'Leadership', 'Teamwork', 'Problem-solving'];
  urgencyLevels = ['Low', 'Medium', 'High'];

  constructor(private fb: FormBuilder) {
    this.eventForm = this.fb.group({
      eventName: ['Volunteer work MOCK', [Validators.required, Validators.maxLength(100)]],
      eventDescription: ['Idk doing some volunteer work.', Validators.required],
      location: ['New York City', Validators.required],
      requiredSkills: [['Teamwork', 'Communication'], Validators.required],
      urgency: ['High', Validators.required],
      eventDate: ['2024-09-30', Validators.required], 
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      console.log('Event Details:', this.eventForm.value);
      // Handle event update (e.g., send to server or update state)
    } else {
      alert('Please complete the form correctly.');
    }
  }

}
