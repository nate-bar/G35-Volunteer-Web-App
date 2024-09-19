import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; 
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

interface VolunteerHistory {
  volunteerName: string;
  eventName: string;
  date: string;
  role: string;
  hours: number;
}

@Component({
  selector: 'app-volunteer-history',
  standalone: true,
  imports: [NgbPaginationModule, ReactiveFormsModule,CommonModule], 
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
      { volunteerName: 'John Doe', eventName: 'Community Cleanup', date: '2024-01-15', role: 'Participant', hours: 4 },
      { volunteerName: 'Jane Smith', eventName: 'Charity Run', date: '2024-03-10', role: 'Coordinator', hours: 6 },
      { volunteerName: 'Alice Brown', eventName: 'Food Drive', date: '2024-05-05', role: 'Volunteer', hours: 5 },
      { volunteerName: 'Bob Johnson', eventName: 'Teaching Workshop', date: '2024-06-20', role: 'Instructor', hours: 8 },
      { volunteerName: 'Charlie Wilson', eventName: 'Park Renovation', date: '2024-08-30', role: 'Organizer', hours: 10 },
      { volunteerName: 'David Martin', eventName: 'Tree Plantation', date: '2024-09-10', role: 'Volunteer', hours: 3 },
      { volunteerName: 'Ella Thompson', eventName: 'Beach Cleanup', date: '2024-10-05', role: 'Coordinator', hours: 7 },
      { volunteerName: 'Frank White', eventName: 'Blood Donation Camp', date: '2024-11-01', role: 'Volunteer', hours: 6 },
      { volunteerName: 'Grace Clark', eventName: 'Community Outreach', date: '2024-12-12', role: 'Organizer', hours: 9 },
      { volunteerName: 'Henry Lewis', eventName: 'Animal Shelter Support', date: '2024-12-25', role: 'Volunteer', hours: 5 }
    ];

    // Initialize filtered history with all entries
    this.filteredHistory = [...this.volunteerHistory];

    
    this.searchControl.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterHistory(searchTerm ?? ''); // Use an empty string if the searchTerm is null
    });
  }

  // Filter 
  filterHistory(searchTerm: string) {
    if (!searchTerm) {
      this.filteredHistory = [...this.volunteerHistory];
    } else {
      this.filteredHistory = this.volunteerHistory.filter(history =>
        history.volunteerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        history.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }
}
