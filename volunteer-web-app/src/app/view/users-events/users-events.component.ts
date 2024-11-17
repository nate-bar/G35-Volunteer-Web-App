import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationComponent } from "../../notification/notification.component";
import { volunteerHistoryService } from '../../pages/volunteer-history/volunteer-history.service';
interface Event {
  eventDate: string;
  eventDescription: string;
  eventName: string;
  location: string;
  requiredSkills: string[];
  urgency: string;
  imageUrl: string;
}

@Component({
  selector: 'app-users-events',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationComponent],
  templateUrl: './users-events.component.html',
  styleUrls: ['./users-events.component.scss'],
})

export class UsersEventsComponent implements OnInit {
  pastEvents: Event[] = [];
  upcomingEvents: Event[] = [];

  constructor(private volHistService: volunteerHistoryService) { }

  ngOnInit(): void {
    this.loadUserEvents();
  }

  loadUserEvents(): void {
    this.volHistService.getUsersEvents().subscribe((data: any) => {
      // Assuming user email is available in localStorage
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('User email not found.');
        return;
      }

      // Filter events for the logged-in user
      const userHistory = data.find((user: any) => user.user_email === userEmail);
      if (userHistory) {
        const now = new Date();
        userHistory.events.forEach((eventRecord: any) => {
          const event: Event = {
            eventName: eventRecord.event.eventName,
            eventDescription: eventRecord.event.eventDescription,
            location: eventRecord.event.location,
            requiredSkills: eventRecord.event.requiredSkills,
            urgency: eventRecord.event.urgency,
            eventDate: eventRecord.event.eventDate,
            imageUrl: eventRecord.event.imageUrl || 'CharityWalk.jpg' || 'fooddrive.jpg'||'comclean.jpg',
          };
          const eventDate = new Date(event.eventDate);
          if (eventDate < now) {
            this.pastEvents.push(event);
          } else {
            this.upcomingEvents.push(event);
          }
        });
      } else {
        console.warn('No events found for the current user.');
      }
    });
  }

  participateInEvent(eventName: string): void {
    alert(`You have registered to participate in: ${eventName}`);
  }

}

