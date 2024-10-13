import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { volunteerMatchingService } from './volunteer-matching.service';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';


interface Event {
  id: number; 
  eventName: string;
  requiredSkills: string[];
}

interface User {
  email: string; 
  full_name: string;
  skills: string[];
}

@Component({
  selector: 'app-volunteer-matching',
  standalone: true,
  imports: [CommonModule, MatSelectModule, ReactiveFormsModule], 
  templateUrl: './volunteer-matching.component.html',
  styleUrls: ['./volunteer-matching.component.scss']
})
export class VolunteerMatchingComponent implements OnInit {
  matchingForm: FormGroup;
  email = new FormControl('', [
    Validators.required,
    Validators.email,
    Validators.maxLength(100),
  ]);

  userId = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
  ]);
  alertMessage: string = '';
  events: Event[] = [];
  users: User[] = [];
  matchedEvents: Event[] = []; 
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private volunteerMatchingService: volunteerMatchingService) {
    this.matchingForm = this.fb.group({
      selectedUser: new FormControl('', Validators.required),
      selectedEvent: new FormControl('', Validators.required),
    });
  }
  
  ngOnInit(): void {
    this.volunteerMatchingService.getUsers().subscribe((users) => {
      this.users = users;
    });

    this.volunteerMatchingService.getEvents().subscribe((events) => {
      this.events = events;
    });
  }


  onMatchSubmit(): void {
    const selectedUser = this.matchingForm.get('selectedUser')?.value;
    const selectedEvent = this.matchingForm.get('selectedEvent')?.value;


    console.log("SUBMIT")

    if (selectedUser && selectedEvent) {
      this.loading = true;
      const matchData = { email: selectedUser, event_id: selectedEvent };

      this.volunteerMatchingService.match(matchData).subscribe(
        (response: any) => {
          this.successMessage = `Volunteer ${selectedUser} successfully matched to: ${selectedEvent}`;
          this.errorMessage = '';
          this.loading = false;
          this.matchingForm.reset();
        },
        (error) => {
          this.successMessage = '';
          this.errorMessage = error.error?.error || 'An unexpected error occurred. Please try again.';
          this.loading = false;
        }
      );
    } else {
      this.errorMessage = 'Please select both a user and an event.';
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin']); 
  }
}
