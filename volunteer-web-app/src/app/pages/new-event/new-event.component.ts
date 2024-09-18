import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-new-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
   
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
   
  ],
  templateUrl: './new-event.component.html',
  styleUrl: './new-event.component.scss'
})
export class NewEventComponent {
  eventForm: FormGroup;
  skills = ['Communication', 'Leadership', 'Teamwork', 'Problem-solving'];
  urgencyLevels = ['Low', 'Medium', 'High'];

  constructor(private fb: FormBuilder) {
    this.eventForm = this.fb.group({
      eventName: ['', [Validators.required, Validators.maxLength(100)]],
      eventDescription: ['', Validators.required],
      location: ['', Validators.required],
      requiredSkills: [[], Validators.required],
      urgency: ['', Validators.required],
      eventDate: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      console.log('Event Details:', this.eventForm.value);
      // Handle event creation (e.g., send to server or update state)
    } else {
      alert('Please complete the form correctly.');
    }
  }

}
