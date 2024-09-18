import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent {
  constructor(private router: Router) {
    console.log('EventsComponent initialized');
  }

  events = [
    {
      eventName: 'Community Cleanup',
      eventDescription: 'Join us for a community cleanup event in the local park.',
      location: 'Central Park',
      requiredSkills: ['Teamwork', 'Environmental Awareness'],
      urgency: 'High',
      eventDate: '2024-10-01',
    },
    {
      eventName: 'Charity Run',
      eventDescription: 'Participate in our annual charity run to support local schools.',
      location: 'Downtown City',
      requiredSkills: ['Running', 'Fundraising'],
      urgency: 'Medium',
      eventDate: '2024-11-05',
    },
    {
      eventName: 'Food Drive',
      eventDescription: 'Help collect and distribute food to those in need.',
      location: 'Community Center',
      requiredSkills: ['Organizing', 'Public Speaking'],
      urgency: 'Low',
      eventDate: '2024-12-12',
    },
  ];

  editEvent() {
    console.log("EDIT CLICKED")
    this.router.navigate(['/admin/editEvent']);
  }

 
  deleteEvent(eventName: string): void {
    this.events = this.events.filter(event => event.eventName !== eventName);
  }
}
