import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule,FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { map, startWith } from 'rxjs/operators';


@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule,NgbModule,ReactiveFormsModule],
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
    {
      eventName: 'Blood Donation Camp',
      eventDescription: 'Donate blood to help save lives in our community.',
      location: 'Health Center',
      requiredSkills: ['Nursing', 'Organization'],
      urgency: 'High',
      eventDate: '2024-09-25',
    },
    {
      eventName: 'Tree Planting Day',
      eventDescription: 'Join us to plant trees and promote environmental sustainability.',
      location: 'City Garden',
      requiredSkills: ['Gardening', 'Teamwork'],
      urgency: 'Medium',
      eventDate: '2024-10-10',
    },
    {
      eventName: 'Senior Citizen Assistance',
      eventDescription: 'Assist senior citizens with their daily activities at the community center.',
      location: 'Senior Center',
      requiredSkills: ['Compassion', 'First Aid'],
      urgency: 'Low',
      eventDate: '2024-11-15',
    },
    {
      eventName: 'Art Workshop for Kids',
      eventDescription: 'Conduct an art workshop for children to unleash their creativity.',
      location: 'Art Studio',
      requiredSkills: ['Creativity', 'Patience'],
      urgency: 'Medium',
      eventDate: '2024-10-20',
    },
    {
      eventName: 'Music Therapy Session',
      eventDescription: 'Provide music therapy to individuals with special needs.',
      location: 'Therapy Center',
      requiredSkills: ['Music', 'Empathy'],
      urgency: 'High',
      eventDate: '2024-09-30',
    },
    {
      eventName: 'Beach Cleanup',
      eventDescription: 'Help clean up the local beach to protect marine life.',
      location: 'Sandy Beach',
      requiredSkills: ['Teamwork', 'Environmental Awareness'],
      urgency: 'High',
      eventDate: '2024-10-05',
    },
    {
      eventName: 'Coding for Beginners',
      eventDescription: 'Teach coding basics to school students.',
      location: 'Tech Hub',
      requiredSkills: ['Coding', 'Teaching'],
      urgency: 'Medium',
      eventDate: '2024-11-02',
    },
    {
      eventName: 'Soup Kitchen Volunteer',
      eventDescription: 'Serve meals to those in need at the local soup kitchen.',
      location: 'Downtown Soup Kitchen',
      requiredSkills: ['Cooking', 'Customer Service'],
      urgency: 'High',
      eventDate: '2024-10-18',
    },
    {
      eventName: 'Book Donation Drive',
      eventDescription: 'Collect and distribute books to underprivileged children.',
      location: 'Community Library',
      requiredSkills: ['Organizing', 'Public Speaking'],
      urgency: 'Low',
      eventDate: '2024-11-22',
    },
    {
      eventName: 'Animal Shelter Support',
      eventDescription: 'Assist with caring for animals at the shelter.',
      location: 'Animal Shelter',
      requiredSkills: ['Animal Care', 'Compassion'],
      urgency: 'Medium',
      eventDate: '2024-10-25',
    },
    {
      eventName: 'Park Beautification',
      eventDescription: 'Help beautify the park by planting flowers and picking up litter.',
      location: 'Sunset Park',
      requiredSkills: ['Gardening', 'Teamwork'],
      urgency: 'Low',
      eventDate: '2024-11-10',
    },
    {
      eventName: 'Health and Wellness Fair',
      eventDescription: 'Organize a fair to promote health and wellness in the community.',
      location: 'Town Hall',
      requiredSkills: ['Organization', 'Health Education'],
      urgency: 'High',
      eventDate: '2024-09-28',
    },
    {
      eventName: 'Language Exchange Meetup',
      eventDescription: 'Help facilitate a language exchange event to promote cultural learning.',
      location: 'Community Hall',
      requiredSkills: ['Language Skills', 'Communication'],
      urgency: 'Medium',
      eventDate: '2024-10-15',
    },
    {
      eventName: 'Tech for Seniors',
      eventDescription: 'Teach senior citizens how to use smartphones and computers.',
      location: 'Community Center',
      requiredSkills: ['Technology', 'Patience'],
      urgency: 'Low',
      eventDate: '2024-11-18',
    },
    {
      eventName: 'Clothing Donation Drive',
      eventDescription: 'Collect and distribute clothing to those in need.',
      location: 'Community Center',
      requiredSkills: ['Organizing', 'Public Speaking'],
      urgency: 'High',
      eventDate: '2024-10-22',
    },
    {
      eventName: 'Winter Coat Drive',
      eventDescription: 'Collect winter coats for the homeless and distribute them before winter.',
      location: 'City Shelter',
      requiredSkills: ['Fundraising', 'Community Outreach'],
      urgency: 'High',
      eventDate: '2024-11-01',
    },
    {
      eventName: 'Youth Mentorship Program',
      eventDescription: 'Mentor youth to guide them in their career paths and personal development.',
      location: 'Youth Center',
      requiredSkills: ['Mentorship', 'Communication'],
      urgency: 'Medium',
      eventDate: '2024-12-05',
    }
  ];
  


  filteredEvents = [...this.events]; // Initialize with all events
  filter = new FormControl(''); 
  page = 1;
  pageSize = 5;

  ngOnInit(): void {
    
    this.filter.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterEvents(searchTerm || ''); 
    });
  }

  filterEvents(searchTerm: string) {
    if (!searchTerm) {
     
      this.filteredEvents = [...this.events];
    } else {
      
      this.filteredEvents = this.events.filter(event =>
        event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.requiredSkills.join(', ').toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.urgency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventDate.includes(searchTerm)
      );
    }
  }

  editEvent(): void {
    this.router.navigate(['/admin/editEvent']);
  }

 
  deleteEvent(eventName: string) {
    
    this.events = this.events.filter(event => event.eventName !== eventName);
  
    
    this.filterEvents(this.filter.value || '');
  }
  
}
