import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; 
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

interface VolunteerHistory {
  volunteerName: string;
  eventName: string;
  eventDescription?: string; // Optional, adjust based on your data
  location?: string;          // Optional, adjust based on your data
  urgency?: string;           // Optional, adjust based on your data
  date: Date;                 // Use Date object for proper formatting
  role: string;
  hours: number;
}

@Component({
  selector: 'app-volunteer-history',
  standalone: true,
  imports: [NgbPaginationModule, ReactiveFormsModule, CommonModule], 
  templateUrl: './volunteer-history.component.html',
  styleUrls: ['./volunteer-history.component.scss']
})
export class VolunteerHistoryComponent implements OnInit {
  volunteerHistory: VolunteerHistory[] = [];
  filteredHistory: VolunteerHistory[] = []; 
  searchControl = new FormControl(''); 
  page = 1;
  pageSize = 5;

  ngOnInit(): void {
    
    this.volunteerHistory = [
      { volunteerName: 'John Doe', eventName: 'Community Cleanup', eventDescription: 'Clean up the local park', location: 'Central Park', urgency: 'High', date: new Date('2024-01-15'), role: 'Participant', hours: 4 },
      { volunteerName: 'Jane Smith', eventName: 'Charity Run', eventDescription: 'Annual charity run for school support', location: 'Downtown', urgency: 'Medium', date: new Date('2024-03-10'), role: 'Coordinator', hours: 6 },
      { volunteerName: 'Alice Brown', eventName: 'Food Drive', eventDescription: 'Collecting food for those in need', location: 'Community Center', urgency: 'High', date: new Date('2024-05-05'), role: 'Volunteer', hours: 5 },
      { volunteerName: 'Bob Johnson', eventName: 'Teaching Workshop', eventDescription: 'Free education for underprivileged children', location: 'Local School', urgency: 'Medium', date: new Date('2024-06-20'), role: 'Instructor', hours: 8 },
      { volunteerName: 'Charlie Wilson', eventName: 'Park Renovation', eventDescription: 'Renovate and beautify the community park', location: 'West Park', urgency: 'Low', date: new Date('2024-08-30'), role: 'Organizer', hours: 10 },
      { volunteerName: 'David Martin', eventName: 'Tree Plantation', eventDescription: 'Planting trees to create a greener city', location: 'City Outskirts', urgency: 'High', date: new Date('2024-09-10'), role: 'Volunteer', hours: 3 },
      { volunteerName: 'Ella Thompson', eventName: 'Beach Cleanup', eventDescription: 'Cleaning the beach for environmental preservation', location: 'Seaside Beach', urgency: 'High', date: new Date('2024-10-05'), role: 'Coordinator', hours: 7 },
      { volunteerName: 'Frank White', eventName: 'Blood Donation Camp', eventDescription: 'Blood donation drive for local hospitals', location: 'Health Center', urgency: 'Medium', date: new Date('2024-11-01'), role: 'Volunteer', hours: 6 },
      { volunteerName: 'Grace Clark', eventName: 'Community Outreach', eventDescription: 'Engage with the community to identify needs', location: 'Community Hall', urgency: 'Medium', date: new Date('2024-12-12'), role: 'Organizer', hours: 9 },
      { volunteerName: 'Henry Lewis', eventName: 'Animal Shelter Support', eventDescription: 'Assist with care for animals in shelters', location: 'Animal Shelter', urgency: 'Low', date: new Date('2024-12-25'), role: 'Volunteer', hours: 5 }
    ];

    
    this.filteredHistory = [...this.volunteerHistory];

    
    this.searchControl.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterHistory(searchTerm ?? ''); 
    });
  }

  
  filterHistory(searchTerm: string) {
    if (!searchTerm) {
      this.filteredHistory = [...this.volunteerHistory];
    } else {
      this.filteredHistory = this.volunteerHistory.filter(history =>
        history.volunteerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        history.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (history.eventDescription && history.eventDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (history.location && history.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (history.urgency && history.urgency.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }
}
