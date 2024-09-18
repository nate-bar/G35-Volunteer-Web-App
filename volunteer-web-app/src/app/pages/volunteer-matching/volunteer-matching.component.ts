import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';


interface Event {
  eventName: string;
  requiredSkills: string[];
}


interface User {
  fullName: string;
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
  profileForm!: FormGroup;

  matchingForm: FormGroup;
  alertMessage: string = '';
  
  
  events: Event[] = [
    { eventName: 'Community Cleanup', requiredSkills: ['Teamwork', 'Environmental Awareness'] },
    { eventName: 'Charity Run', requiredSkills: ['Running', 'Fundraising'] },
    { eventName: 'Food Drive', requiredSkills: ['Organizing', 'Public Speaking'] },
    { eventName: 'Tree Planting', requiredSkills: ['Gardening', 'Teamwork'] },
    { eventName: 'Coding Workshop', requiredSkills: ['Programming', 'Teaching'] }
  ];
  
  
  users: User[] = [
    { fullName: 'John Doe', skills: ['Teamwork', 'Environmental Awareness'] },
    { fullName: 'Jane Smith', skills: ['Programming', 'Teaching'] },
    { fullName: 'Emily Johnson', skills: ['Running', 'Fundraising'] },
    { fullName: 'Michael Brown', skills: ['Gardening', 'Organizing'] },
    { fullName: 'Sarah Davis', skills: ['Public Speaking', 'Environmental Awareness'] }
  ];
  
  matchedEvents: Event[] = []; 

  constructor(private fb: FormBuilder,private router: Router) {
    
    this.matchingForm = this.fb.group({
      selectedUser: [''], 
      matchedEvent: ['']
    });
  }

  ngOnInit(): void {
    
    this.matchingForm.get('selectedUser')?.valueChanges.subscribe((selectedUser) => {
      this.matchEvents(selectedUser);
    });
  }

  matchEvents(selectedUser: string): void {
    const user = this.users.find(u => u.fullName === selectedUser);
    if (user) {
      this.matchedEvents = this.events.filter(event =>
        event.requiredSkills.some(skill => user.skills.includes(skill))
      );

      
      if (this.matchedEvents.length > 0) {
        this.matchingForm.patchValue({
          matchedEvent: this.matchedEvents[0].eventName
        });
      } else {
        this.matchingForm.patchValue({
          matchedEvent: ''
        });
      }
    }
  }

  onMatchSubmit(): void {
    const selectedUser = this.matchingForm.get('selectedUser')?.value;
    const selectedEvent = this.matchingForm.get('matchedEvent')?.value;
    if (selectedUser && selectedEvent) {
      this.alertMessage = `Volunteer ${selectedUser} successfully matched to: ${selectedEvent}`;
      console.log(this.alertMessage);
    }
  }
  onCancel(): void {
    this.router.navigate(['/admin']); 
  }
}
