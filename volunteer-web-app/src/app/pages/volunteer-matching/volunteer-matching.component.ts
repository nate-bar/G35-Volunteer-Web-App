import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { volunteerMatchingService } from './volunteer-matching.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms'; 
import { MatButtonModule } from '@angular/material/button';

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
  imports: [CommonModule, MatSelectModule, ReactiveFormsModule, MatButtonModule ], 
  templateUrl: './volunteer-matching.component.html',
  styleUrls: ['./volunteer-matching.component.scss']
})
export class VolunteerMatchingComponent implements OnInit {
  matchingForm: FormGroup;
  events: Event[] = [];
  users: User[] = [];
  matchedEvents: Event[] = [];
  alertMessage: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private volunteerMatchingService: volunteerMatchingService
  ) {
    this.matchingForm = this.fb.group({
      selectedUser: ['', Validators.required],
      selectedEvent: ['', Validators.required]
      // participationHours: ['', Validators.required],
      // participationStatus: ['Pending', Validators.required]
    });
  }

  ngOnInit(): void {
    
    this.volunteerMatchingService.getVolunteers().subscribe((response) => {
      if (Array.isArray(response)) {
        this.users = response;
      } else if (response && response.users) {
        this.users = response.users; 
      }
    });
  
    
    this.volunteerMatchingService.getEvents().subscribe((response) => {
      if (Array.isArray(response)) {
        this.events = response;
      } else if (response && response.events) {
        this.events = response.events; 
      }
    });
  
    this.matchingForm.get('selectedUser')?.valueChanges.subscribe((selectedUser) => {
      if (selectedUser) {
        this.volunteerMatchingService.getMatchedEvents(selectedUser).subscribe((response: any) => {
          if (response && Array.isArray(response.events)) {
            this.matchedEvents = response.events;  
          } else {
            this.matchedEvents = [];
          }
        });
      }
    });
  }
  
  onMatchSubmit(): void {
    // if (this.matchingForm.invalid) {
    //   this.successMessage = ''; 
    //   this.errorMessage = 'Please fill out the form correctly.';
      
    //   return;
    // }
  
    const matchData = {
      selectedUser: this.matchingForm.get('selectedUser')?.value,  
      selectedEvent: this.matchingForm.get('selectedEvent')?.value  
      // participation_hours: this.matchingForm.get('participationHours')?.value,
      // participation_status: this.matchingForm.get('participationStatus')?.value
    };
  
    this.volunteerMatchingService.match(matchData).subscribe(
      (response: any) => {
        this.alertMessage= response.message;
        
        // this.successMessage = `Volunteer ${matchData.selectedUser} successfully matched to event ${matchData.selectedEvent}`;
        this.errorMessage = '';
        
        this.loading = false;
        this.matchingForm.reset();
      },
      (error) => {
        this.alertMessage = '';
        this.errorMessage = error.error?.error || 'An unexpected error occurred. Please try again.';
        this.loading = false;
      }
    );
  }
  
  

  sendReminder(): void {
    const selectedEvent = this.matchingForm.get('selectedEvent')?.value; 
    
    if (!selectedEvent) {
      this.errorMessage = 'Please select an event before sending a reminder.';
      return; 
    }
  
    this.volunteerMatchingService.sendReminder(selectedEvent).subscribe(
      (response: any) => {
        this.alertMessage = response.message ||'Reminder sent to assigned users!';
        this.errorMessage = ''; 
      },
      (error) => {
        this.errorMessage = error.error?.error || 'An error occurred while sending the reminder.';
      }
    );
  }
  

  

  onCancel(): void {
    this.router.navigate(['/admin']);
  }
}
