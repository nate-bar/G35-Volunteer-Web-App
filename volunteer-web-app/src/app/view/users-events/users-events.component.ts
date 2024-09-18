import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-events.component.html',
  styleUrls: ['./users-events.component.scss'],
})
export class UsersEventsComponent {
  events = [
    {
      eventName: 'Community Cleanup',
      eventDescription: 'Join us for a community cleanup event in the local park.',
      location: 'Central Park',
      requiredSkills: ['Teamwork', 'Environmental Awareness'],
      urgency: 'High',
      eventDate: '2024-10-01',
      imageUrl: 'comclean.jpg'
    },
    {
      eventName: 'Charity Run',
      eventDescription: 'Participate in our annual charity run to support local schools.',
      location: 'Downtown City',
      requiredSkills: ['Running', 'Fundraising'],
      urgency: 'Medium',
      eventDate: '2024-11-05',
      imageUrl: 'CharityWalk.jpg'
    },
    {
      eventName: 'Food Drive',
      eventDescription: 'Help collect and distribute food to those in need.',
      location: 'Community Center',
      requiredSkills: ['Organizing', 'Public Speaking'],
      urgency: 'Low',
      eventDate: '2024-12-12',
      imageUrl: 'fooddrive.jpg'
    },
  ];

  participateInEvent(eventName: string): void {
    alert(`You have registered to participate in: ${eventName}`);
  }

}

