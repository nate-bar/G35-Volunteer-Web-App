import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { volunteerMatchingService } from './volunteer-matching.service';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';


interface Event {
  id: number; 
  eventName: string;
  eventDate: string;
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
  events: Event[] = [];
  users: User[] = [];
  matchedEvents: Event[] = [];
  alertMessage: string = '';
  matchedUsers: User[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private volunteerMatchingService: volunteerMatchingService, private cd: ChangeDetectorRef) {
    this.matchingForm = this.fb.group({
      selectedUser: new FormControl('', Validators.required),
      selectedEvent: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    this.volunteerMatchingService.getUsers().subscribe((users) => {
      this.users = users;
      this.cd.detectChanges();
    });
  
    this.volunteerMatchingService.getEvents().subscribe((events) => {
      this.events = events;
      this.cd.detectChanges();
    });
  
    this.matchingForm.get('selectedUser')?.valueChanges.subscribe((selectedUser) => {
      if (selectedUser) {
        const currentEvent = this.matchingForm.get('selectedEvent')?.value;
        this.volunteerMatchingService.getEventsForUser(selectedUser).subscribe((events) => {
          this.matchedEvents = events;
          this.cd.detectChanges();

          if (events.some((event: Event) => event?.id === currentEvent)) {
            this.matchingForm.get('selectedEvent')?.setValue(currentEvent, { emitEvent: false });
          }
        });
      }
    });
  
    this.matchingForm.get('selectedEvent')?.valueChanges.subscribe((selectedEvent) => {
      if (selectedEvent) {
        const currentUser = this.matchingForm.get('selectedUser')?.value;
        this.volunteerMatchingService.getUsersForEvent(selectedEvent).subscribe((users) => {
          this.matchedUsers = users;
          this.cd.detectChanges();  
          
          if (users.some((user: User) => user?.email === currentUser)) {
            this.matchingForm.get('selectedUser')?.setValue(currentUser, { emitEvent: false });
          }
        });
      }
    });
  }

  onMatchSubmit(): void {
    const selectedUser = this.matchingForm.get('selectedUser')?.value;
    const selectedEvent = this.matchingForm.get('selectedEvent')?.value;

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