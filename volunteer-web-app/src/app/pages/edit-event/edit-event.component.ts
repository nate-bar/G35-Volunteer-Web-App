import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { CommonModule } from '@angular/common'; 



@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    MdbFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.scss'
})
export class EditEventComponent {
  eventForm: FormGroup;
  skills = ['Communication', 'Leadership', 'Teamwork', 'Problem-solving'];
  urgencyLevels = ['Low', 'Medium', 'High'];

  constructor(private fb: FormBuilder) {
    // initial values to be changed to values from the BE
    const initialValues = {
      eventName: 'Team Meeting',
      eventDescription: 'Discuss project updates',
      location: 'Conference Room B',
      requiredSkills: ['Leadership', 'Teamwork'],
      urgency: 'High',
      eventDate: '2024-09-17',
    };


    this.eventForm = this.fb.group({
      eventName: [initialValues.eventName, [Validators.required, Validators.maxLength(100)]],
      eventDescription: [initialValues.eventDescription, Validators.required],
      location: [initialValues.location, Validators.required],
      requiredSkills: [initialValues.requiredSkills, Validators.required],
      urgency: [initialValues.urgency, Validators.required],
      eventDate: [initialValues.eventDate, Validators.required],
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
